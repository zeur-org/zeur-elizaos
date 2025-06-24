import { logger } from '../utils/logger.js';
import { 
    StakingProtocol, 
    PortfolioPosition, 
    OptimizationStrategy, 
    MarketData, 
    RebalanceTransaction,
    PerformanceMetrics,
    RiskAssessment 
} from '../types/index.js';
import { BlockchainService } from './blockchain-service.js';
import { DataService } from './data-service.js';
import { RiskAnalyzer } from './risk-analyzer.js';

export class YieldOptimizer {
    private blockchainService: BlockchainService;
    private dataService: DataService;
    private riskAnalyzer: RiskAnalyzer;
    private currentStrategy: OptimizationStrategy;
    private positions: Map<string, PortfolioPosition>;
    private pendingTransactions: Map<string, RebalanceTransaction>;

    constructor() {
        this.blockchainService = new BlockchainService();
        this.dataService = new DataService();
        this.riskAnalyzer = new RiskAnalyzer();
        this.positions = new Map();
        this.pendingTransactions = new Map();
        
        // Initialize default strategy
        this.currentStrategy = {
            targetAllocations: new Map([
                ['lido', 35],
                ['rocketpool', 25],
                ['etherfi', 25],
                ['morpho', 15]
            ]),
            expectedAPR: 8.0,
            riskScore: 3.0,
            rebalanceThreshold: 0.05,
            maxGasPrice: Number(process.env.MAX_GAS_PRICE_GWEI) || 50,
            riskTolerance: (process.env.RISK_TOLERANCE as any) || 'moderate'
        };
    }

    async initializePositions(): Promise<void> {
        logger.info('Initializing portfolio positions...');
        
        const protocols = await this.dataService.getAvailableProtocols();
        
        for (const protocol of protocols) {
            const blockchainData = await this.blockchainService.getProtocolData(protocol.name);
            
            if (blockchainData) {
                const position: PortfolioPosition = {
                    protocol: { ...protocol, ...blockchainData },
                    currentAmount: blockchainData.totalStaked || 0n,
                    targetAmount: 0n,
                    currentPercentage: 0,
                    targetPercentage: this.currentStrategy.targetAllocations.get(protocol.name) || 0,
                    lstTokenBalance: 0n,
                    pendingWithdrawals: 0n
                };
                
                this.positions.set(protocol.name, position);
            }
        }
        
        await this.updatePositionPercentages();
        logger.info(`Initialized ${this.positions.size} protocol positions`);
    }

    async optimizeAllocation(marketData: MarketData): Promise<OptimizationStrategy> {
        logger.info('Calculating optimal allocation strategy...');
        
        // Calculate risk-adjusted returns
        const riskAdjustedReturns = new Map<string, number>();
        
        for (const [protocolName, apr] of marketData.protocolAPRs) {
            const risk = marketData.protocolRisks.get(protocolName) || 0;
            const riskAdjustedReturn = apr * (1 - risk / 100);
            riskAdjustedReturns.set(protocolName, riskAdjustedReturn);
        }
        
        // Optimize allocations based on risk tolerance
        const newAllocations = this.calculateOptimalAllocations(
            riskAdjustedReturns,
            marketData
        );
        
        const expectedAPR = this.calculateExpectedAPR(newAllocations, marketData.protocolAPRs);
        
        const newStrategy: OptimizationStrategy = {
            targetAllocations: newAllocations,
            expectedAPR,
            riskScore: this.calculateOverallRisk(marketData.protocolRisks),
            rebalanceThreshold: this.currentStrategy.rebalanceThreshold,
            maxGasPrice: this.adjustGasThreshold(marketData.gasPrice),
            riskTolerance: this.currentStrategy.riskTolerance
        };
        
        logger.info(`New strategy calculated - Expected APR: ${expectedAPR.toFixed(2)}%`);
        
        return newStrategy;
    }

    private calculateOptimalAllocations(
        riskAdjustedReturns: Map<string, number>,
        marketData: MarketData
    ): Map<string, number> {
        const allocations = new Map<string, number>();
        
        // Sort protocols by risk-adjusted returns
        const sortedProtocols = Array.from(riskAdjustedReturns.entries())
            .sort(([,a], [,b]) => b - a);
        
        let remainingAllocation = 100;
        
        for (const [protocolName, return_] of sortedProtocols) {
            const baseAllocation = this.getBaseAllocation(protocolName);
            const riskMultiplier = this.getRiskMultiplier(
                marketData.protocolRisks.get(protocolName) || 0
            );
            const performanceMultiplier = this.getPerformanceMultiplier(return_);
            
            let allocation = baseAllocation * riskMultiplier * performanceMultiplier;
            
            // Ensure we don't over-allocate
            allocation = Math.min(allocation, remainingAllocation);
            remainingAllocation -= allocation;
            
            allocations.set(protocolName, allocation);
        }
        
        return allocations;
    }

    private getBaseAllocation(protocolName: string): number {
        const baseAllocations: Record<string, number> = {
            'lido': 30,
            'rocketpool': 25,
            'etherfi': 25,
            'morpho': 20
        };
        
        return baseAllocations[protocolName] || 15;
    }

    private getRiskMultiplier(riskScore: number): number {
        const tolerance = this.currentStrategy.riskTolerance;
        
        switch (tolerance) {
            case 'conservative':
                return Math.max(0.5, 1 - riskScore / 50);
            case 'aggressive':
                return Math.min(1.5, 1 + riskScore / 100);
            default: // moderate
                return Math.max(0.7, 1 - riskScore / 100);
        }
    }

    private getPerformanceMultiplier(return_: number): number {
        const baseline = 7.0;
        const excess = return_ - baseline;
        return 1 + Math.tanh(excess / 5) * 0.3;
    }

    private calculateExpectedAPR(
        allocations: Map<string, number>,
        protocolAPRs: Map<string, number>
    ): number {
        let weightedAPR = 0;
        
        for (const [protocol, allocation] of allocations) {
            const apr = protocolAPRs.get(protocol) || 0;
            weightedAPR += (allocation / 100) * apr;
        }
        
        return weightedAPR;
    }

    private calculateOverallRisk(protocolRisks: Map<string, number>): number {
        let totalRisk = 0;
        for (const risk of protocolRisks.values()) {
            totalRisk += risk;
        }
        return totalRisk / protocolRisks.size;
    }

    private adjustGasThreshold(currentGasPrice: number): number {
        const baseThreshold = Number(process.env.MAX_GAS_PRICE_GWEI) || 50;
        
        if (currentGasPrice < baseThreshold * 0.5) {
            return baseThreshold * 1.2;
        } else if (currentGasPrice > baseThreshold * 1.5) {
            return baseThreshold * 0.8;
        }
        
        return baseThreshold;
    }

    async shouldRebalance(newStrategy: OptimizationStrategy): Promise<boolean> {
        const rebalanceNeeded = this.calculateRebalanceNeed(newStrategy);
        const gasConditionsMet = await this.checkGasConditions();
        const riskAcceptable = this.checkRiskThresholds(newStrategy);
        
        logger.info(`Rebalance analysis - Need: ${rebalanceNeeded.toFixed(3)}, Gas OK: ${gasConditionsMet}, Risk OK: ${riskAcceptable}`);
        
        return rebalanceNeeded > this.currentStrategy.rebalanceThreshold && 
               gasConditionsMet && 
               riskAcceptable;
    }

    private calculateRebalanceNeed(newStrategy: OptimizationStrategy): number {
        let totalDifference = 0;
        
        for (const [protocol, targetPercentage] of newStrategy.targetAllocations) {
            const currentPercentage = this.positions.get(protocol)?.currentPercentage || 0;
            totalDifference += Math.abs(targetPercentage - currentPercentage);
        }
        
        return totalDifference / 100; // Convert to decimal
    }

    private async checkGasConditions(): Promise<boolean> {
        const gasPrice = await this.blockchainService.getGasPrice();
        return gasPrice <= this.currentStrategy.maxGasPrice;
    }

    private checkRiskThresholds(newStrategy: OptimizationStrategy): boolean {
        const maxRiskScore = this.currentStrategy.riskTolerance === 'conservative' ? 4 :
                            this.currentStrategy.riskTolerance === 'aggressive' ? 8 : 6;
        
        return newStrategy.riskScore <= maxRiskScore;
    }

    async executeRebalance(newStrategy: OptimizationStrategy): Promise<RebalanceTransaction[]> {
        logger.info('Executing portfolio rebalance...');
        
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
                status: 'pending',
                timestamp: new Date()
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
    ): Array<{from: string, to: string, amount: bigint}> {
        const movements: Array<{from: string, to: string, amount: bigint}> = [];
        
        // Calculate surpluses and deficits
        const surpluses = new Map<string, bigint>();
        const deficits = new Map<string, bigint>();
        
        for (const [protocol, targetPercentage] of newStrategy.targetAllocations) {
            const position = this.positions.get(protocol);
            if (!position) continue;
            
            const targetAmount = (totalValue * BigInt(Math.round(targetPercentage * 100))) / 10000n;
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
                
                const moveAmount = remainingSurplus < deficitAmount ? remainingSurplus : deficitAmount;
                
                movements.push({
                    from: fromProtocol,
                    to: toProtocol,
                    amount: moveAmount
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
        movement: {from: string, to: string, amount: bigint},
        transaction: RebalanceTransaction
    ): Promise<void> {
        try {
            transaction.status = 'executing';
            
            // First unstake from the source protocol
            const unstakeTxHash = await this.blockchainService.executeUnstake(
                movement.from, 
                movement.amount
            );
            
            if (!unstakeTxHash) {
                throw new Error(`Failed to unstake from ${movement.from}`);
            }
            
            // Wait for unstake to complete
            const unstakeSuccess = await this.blockchainService.waitForTransaction(unstakeTxHash);
            
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
            const stakeSuccess = await this.blockchainService.waitForTransaction(stakeTxHash);
            
            if (stakeSuccess) {
                transaction.status = 'completed';
                
                // Update position tracking
                await this.updatePositionAmounts(movement.from, movement.to, movement.amount);
                
                logger.info(`Movement completed: ${movement.amount} from ${movement.from} to ${movement.to}`);
            } else {
                transaction.status = 'failed';
                logger.error(`Stake transaction failed: ${stakeTxHash}`);
            }
            
        } catch (error) {
            transaction.status = 'failed';
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
            position.currentPercentage = Number(
                (position.currentAmount * 10000n) / totalValue
            ) / 100;
        }
    }

    async getPerformanceMetrics(timeRange: string = '24h'): Promise<PerformanceMetrics> {
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
            timeRange
        };
    }

    private calculateCurrentAPR(): number {
        let weightedAPR = 0;
        
        for (const position of this.positions.values()) {
            weightedAPR += position.currentPercentage * position.protocol.currentAPR / 100;
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
} 