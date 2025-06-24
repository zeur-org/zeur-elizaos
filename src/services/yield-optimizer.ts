import { logger } from "../utils/logger.js";
import {
  StakingProtocol,
  PortfolioPosition,
  OptimizationStrategy,
  MarketData,
  RebalanceTransaction,
  PerformanceMetrics,
  RiskAssessment,
} from "../types/index.js";
import { BlockchainService } from "./blockchain-service.js";
import { DataService } from "./data-service.js";
import { RiskAnalyzer } from "./risk-analyzer.js";

export class YieldOptimizer {
  private blockchainService: BlockchainService;
  private dataService: DataService;
  private riskAnalyzer: RiskAnalyzer;
  private currentStrategy: OptimizationStrategy;
  private positions: Map<string, PortfolioPosition>;
  private pendingTransactions: Map<string, RebalanceTransaction>;
  private riskTolerance: "conservative" | "moderate" | "aggressive" =
    "moderate";

  constructor(riskTolerance?: "conservative" | "moderate" | "aggressive") {
    this.blockchainService = new BlockchainService();
    this.dataService = new DataService();
    this.riskAnalyzer = new RiskAnalyzer();
    this.positions = new Map();
    this.pendingTransactions = new Map();

    if (riskTolerance) {
      this.riskTolerance = riskTolerance;
    }

    // Initialize default strategy
    this.currentStrategy = {
      targetAllocations: new Map([
        ["lido", 35],
        ["rocketpool", 25],
        ["etherfi", 25],
        ["morpho", 15],
      ]),
      expectedAPR: 8.0,
      riskScore: 3.0,
      rebalanceThreshold: 0.05,
      maxGasPrice: Number(process.env.MAX_GAS_PRICE_GWEI) || 50,
      riskTolerance: this.riskTolerance,
    };
  }

  async initializePositions(): Promise<void> {
    logger.info("Initializing portfolio positions...");

    const protocols = await this.dataService.getAvailableProtocols();

    for (const protocol of protocols) {
      const blockchainData = await this.blockchainService.getProtocolData(
        protocol.name
      );

      if (blockchainData) {
        const position: PortfolioPosition = {
          protocol: { ...protocol, ...blockchainData },
          currentAmount: blockchainData.totalStaked || 0n,
          targetAmount: 0n,
          currentPercentage: 0,
          targetPercentage:
            this.currentStrategy.targetAllocations.get(protocol.name) || 0,
          lstTokenBalance: 0n,
          pendingWithdrawals: 0n,
        };

        this.positions.set(protocol.name, position);
      }
    }

    await this.updatePositionPercentages();
    logger.info(`Initialized ${this.positions.size} protocol positions`);
  }

  async optimizeAllocation(
    marketData: MarketData
  ): Promise<OptimizationStrategy> {
    try {
      logger.info("Starting portfolio optimization");

      // Mock optimization logic
      const targetAllocations = new Map<string, number>();

      // Simple optimization based on risk-adjusted returns
      const protocolData = Array.from(marketData.protocolAPRs.entries());
      const totalWeight = protocolData.reduce((sum, [_, apr]) => sum + apr, 0);

      let remainingPercentage = 100;
      for (const [protocol, apr] of protocolData) {
        if (remainingPercentage <= 0) break;

        // Weight by APR but cap allocations based on risk
        let allocation = Math.min(
          (apr / totalWeight) * 100,
          this.getMaxAllocation(protocol)
        );

        // Ensure we don't exceed remaining percentage
        allocation = Math.min(allocation, remainingPercentage);

        targetAllocations.set(protocol, Math.round(allocation * 100) / 100);
        remainingPercentage -= allocation;
      }

      const expectedAPR = this.calculateExpectedAPR(
        targetAllocations,
        marketData.protocolAPRs
      );
      const riskScore = this.calculateRiskScore(
        targetAllocations,
        marketData.protocolRisks
      );

      return {
        targetAllocations,
        expectedAPR,
        riskScore,
        rebalanceThreshold: 2.0, // 2% drift threshold
        maxGasPrice: 50, // max 50 gwei
        riskTolerance: this.riskTolerance,
      };
    } catch (error) {
      logger.error("Yield optimization failed:", error);
      throw error;
    }
  }

  private getMaxAllocation(protocol: string): number {
    const maxAllocations: Record<string, number> = {
      lido: 40,
      etherfi: 30,
      rocketpool: 30,
      morpho: 20,
    };

    return maxAllocations[protocol] || 25;
  }

  private calculateExpectedAPR(
    allocations: Map<string, number>,
    aprs: Map<string, number>
  ): number {
    let weightedAPR = 0;
    let totalWeight = 0;

    for (const [protocol, allocation] of allocations) {
      const apr = aprs.get(protocol) || 0;
      weightedAPR += (allocation / 100) * apr;
      totalWeight += allocation;
    }

    return totalWeight > 0 ? (weightedAPR / totalWeight) * 100 : 0;
  }

  private calculateRiskScore(
    allocations: Map<string, number>,
    risks: Map<string, number>
  ): number {
    let weightedRisk = 0;
    let totalWeight = 0;

    for (const [protocol, allocation] of allocations) {
      const risk = risks.get(protocol) || 1;
      weightedRisk += (allocation / 100) * risk;
      totalWeight += allocation;
    }

    return totalWeight > 0 ? (weightedRisk / totalWeight) * 100 : 1;
  }

  async shouldRebalance(newStrategy: OptimizationStrategy): Promise<boolean> {
    const rebalanceNeeded = this.calculateRebalanceNeed(newStrategy);
    const gasConditionsMet = await this.checkGasConditions();
    const riskAcceptable = this.checkRiskThresholds(newStrategy);

    logger.info(
      `Rebalance analysis - Need: ${rebalanceNeeded.toFixed(3)}, Gas OK: ${gasConditionsMet}, Risk OK: ${riskAcceptable}`
    );

    return (
      rebalanceNeeded > this.currentStrategy.rebalanceThreshold &&
      gasConditionsMet &&
      riskAcceptable
    );
  }

  private calculateRebalanceNeed(newStrategy: OptimizationStrategy): number {
    let totalDifference = 0;

    for (const [protocol, targetPercentage] of newStrategy.targetAllocations) {
      const currentPercentage =
        this.positions.get(protocol)?.currentPercentage || 0;
      totalDifference += Math.abs(targetPercentage - currentPercentage);
    }

    return totalDifference / 100; // Convert to decimal
  }

  private async checkGasConditions(): Promise<boolean> {
    const gasPrice = await this.blockchainService.getGasPrice();
    return gasPrice <= this.currentStrategy.maxGasPrice;
  }

  private checkRiskThresholds(newStrategy: OptimizationStrategy): boolean {
    const maxRiskScore =
      this.riskTolerance === "conservative"
        ? 4
        : this.riskTolerance === "aggressive"
          ? 8
          : 6;

    return newStrategy.riskScore <= maxRiskScore;
  }

  async executeRebalance(
    newStrategy: OptimizationStrategy
  ): Promise<RebalanceTransaction[]> {
    logger.info("Executing portfolio rebalance...");

    const transactions: RebalanceTransaction[] = [];
    const totalValue = this.getTotalPortfolioValue();

    // Calculate required movements
    const movements = this.calculateRequiredMovements(newStrategy, totalValue);

    for (const movement of movements) {
      const txId = `rebalance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const transaction: RebalanceTransaction = {
        id: txId,
        fromProtocol: movement.from,
        toProtocol: movement.to,
        amount: movement.amount,
        gasPrice: await this.blockchainService.getGasPrice(),
        estimatedGas: 0n,
        status: "pending",
        timestamp: new Date(),
      };

      transactions.push(transaction);
      this.pendingTransactions.set(txId, transaction);

      // Execute the movement
      await this.executeMovement(movement, transaction);
    }

    // Update current strategy
    this.currentStrategy = newStrategy;

    logger.info(`Rebalance executed with ${transactions.length} transactions`);
    return transactions;
  }

  private getTotalPortfolioValue(): bigint {
    let total = 0n;
    for (const position of this.positions.values()) {
      total += position.currentAmount;
    }
    return total;
  }

  private calculateRequiredMovements(
    newStrategy: OptimizationStrategy,
    totalValue: bigint
  ): Array<{ from: string; to: string; amount: bigint }> {
    const movements: Array<{ from: string; to: string; amount: bigint }> = [];

    // Calculate surpluses and deficits
    const surpluses = new Map<string, bigint>();
    const deficits = new Map<string, bigint>();

    for (const [protocol, targetPercentage] of newStrategy.targetAllocations) {
      const position = this.positions.get(protocol);
      if (!position) continue;

      const targetAmount =
        (totalValue * BigInt(Math.round(targetPercentage * 100))) / 10000n;
      const difference = targetAmount - position.currentAmount;

      if (difference > 0) {
        deficits.set(protocol, difference);
      } else if (difference < 0) {
        surpluses.set(protocol, -difference);
      }
    }

    // Match surpluses with deficits
    for (const [fromProtocol, surplusAmount] of surpluses) {
      let remainingSurplus = surplusAmount;

      for (const [toProtocol, deficitAmount] of deficits) {
        if (remainingSurplus === 0n) break;

        const moveAmount =
          remainingSurplus < deficitAmount ? remainingSurplus : deficitAmount;

        movements.push({
          from: fromProtocol,
          to: toProtocol,
          amount: moveAmount,
        });

        remainingSurplus -= moveAmount;
        deficits.set(toProtocol, deficitAmount - moveAmount);

        if (deficits.get(toProtocol) === 0n) {
          deficits.delete(toProtocol);
        }
      }
    }

    return movements;
  }

  private async executeMovement(
    movement: { from: string; to: string; amount: bigint },
    transaction: RebalanceTransaction
  ): Promise<void> {
    try {
      transaction.status = "executing";

      // First unstake from the source protocol
      const unstakeTxHash = await this.blockchainService.executeUnstake(
        movement.from,
        movement.amount
      );

      if (!unstakeTxHash) {
        throw new Error(`Failed to unstake from ${movement.from}`);
      }

      // Wait for unstake to complete
      const unstakeSuccess =
        await this.blockchainService.waitForTransaction(unstakeTxHash);

      if (!unstakeSuccess) {
        throw new Error(`Unstake transaction failed: ${unstakeTxHash}`);
      }

      // Then stake to the destination protocol
      const stakeTxHash = await this.blockchainService.executeStake(
        movement.to,
        movement.amount
      );

      if (!stakeTxHash) {
        throw new Error(`Failed to stake to ${movement.to}`);
      }

      transaction.txHash = stakeTxHash;

      // Wait for stake to complete
      const stakeSuccess =
        await this.blockchainService.waitForTransaction(stakeTxHash);

      if (stakeSuccess) {
        transaction.status = "completed";

        // Update position tracking
        await this.updatePositionAmounts(
          movement.from,
          movement.to,
          movement.amount
        );

        logger.info(
          `Movement completed: ${movement.amount} from ${movement.from} to ${movement.to}`
        );
      } else {
        transaction.status = "failed";
        logger.error(`Stake transaction failed: ${stakeTxHash}`);
      }
    } catch (error) {
      transaction.status = "failed";
      logger.error(`Movement execution failed:`, error);
    }
  }

  private async updatePositionAmounts(
    fromProtocol: string,
    toProtocol: string,
    amount: bigint
  ): Promise<void> {
    const fromPosition = this.positions.get(fromProtocol);
    const toPosition = this.positions.get(toProtocol);

    if (fromPosition) {
      fromPosition.currentAmount -= amount;
    }

    if (toPosition) {
      toPosition.currentAmount += amount;
    }

    await this.updatePositionPercentages();
  }

  private async updatePositionPercentages(): Promise<void> {
    const totalValue = this.getTotalPortfolioValue();

    if (totalValue === 0n) return;

    for (const position of this.positions.values()) {
      position.currentPercentage =
        Number((position.currentAmount * 10000n) / totalValue) / 100;
    }
  }

  async getPerformanceMetrics(
    timeRange: string = "24h"
  ): Promise<PerformanceMetrics> {
    const totalValue = this.getTotalPortfolioValue();
    const currentAPR = this.calculateCurrentAPR();

    return {
      totalValue,
      currentAPR,
      performanceVsBenchmark: 0, // Would need historical data
      totalFeesEarned: 0n, // Would need to track fees
      totalGasSpent: 0n, // Would need to track gas costs
      rebalanceCount: this.pendingTransactions.size,
      sharpeRatio: 0, // Would need volatility data
      maxDrawdown: 0, // Would need historical tracking
      timeRange,
    };
  }

  private calculateCurrentAPR(): number {
    let weightedAPR = 0;

    for (const position of this.positions.values()) {
      weightedAPR +=
        (position.currentPercentage * position.protocol.currentAPR) / 100;
    }

    return weightedAPR;
  }

  getCurrentStrategy(): OptimizationStrategy {
    return { ...this.currentStrategy };
  }

  getPositions(): Map<string, PortfolioPosition> {
    return new Map(this.positions);
  }

  getPendingTransactions(): Map<string, RebalanceTransaction> {
    return new Map(this.pendingTransactions);
  }

  async getCurrentPositions(): Promise<Map<string, PortfolioPosition>> {
    // Mock current positions
    return new Map();
  }
}
