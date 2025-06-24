import { logger } from "../utils/logger.js";
import { StakingProtocol, RiskAssessment } from "../types/index.js";

export class RiskAnalyzer {
  async assessPortfolioRisk(
    protocols: StakingProtocol[]
  ): Promise<RiskAssessment> {
    logger.info("Assessing portfolio risk...");

    const protocolRisks = new Map<string, number>();
    let totalRisk = 0;

    // Calculate individual protocol risks
    for (const protocol of protocols) {
      const risk = this.calculateProtocolRisk(protocol);
      protocolRisks.set(protocol.name, risk);
      totalRisk += risk;
    }

    const averageRisk = totalRisk / protocols.length;
    const concentrationRisk = this.calculateConcentrationRisk(protocols);
    const liquidityRisk = this.calculateLiquidityRisk(protocols);
    const smartContractRisk = this.calculateSmartContractRisk(protocols);

    const overallRisk = this.calculateOverallRisk(
      averageRisk,
      concentrationRisk,
      liquidityRisk,
      smartContractRisk
    );

    const recommendations = this.generateRecommendations(
      overallRisk,
      concentrationRisk,
      liquidityRisk,
      smartContractRisk,
      protocols
    );

    return {
      overallRisk,
      protocolRisks,
      concentrationRisk,
      liquidityRisk,
      smartContractRisk,
      recommendations,
    };
  }

  private calculateProtocolRisk(protocol: StakingProtocol): number {
    // Protocol risk factors (0-10 scale):
    // - Time since launch
    // - Total Value Locked (TVL)
    // - Audit history
    // - Governance decentralization
    // - Technical complexity
    // - Slashing risk

    let risk = protocol.riskScore; // Base risk from protocol data

    // Adjust for withdrawal delay (longer = higher risk)
    risk += protocol.withdrawalDelay * 0.1;

    // Adjust for gas efficiency (lower efficiency = higher operational risk)
    risk += (100 - protocol.gasEfficiency) * 0.02;

    // Cap at 10
    return Math.min(risk, 10);
  }

  private calculateConcentrationRisk(protocols: StakingProtocol[]): number {
    // Herfindahl-Hirschman Index for concentration
    const totalTVL = protocols.reduce(
      (sum, p) => sum + Number(p.totalStaked),
      0
    );

    if (totalTVL === 0) return 0;

    let hhi = 0;
    for (const protocol of protocols) {
      const share = Number(protocol.totalStaked) / totalTVL;
      hhi += share * share;
    }

    // Convert HHI to 0-10 risk scale
    // HHI ranges from 1/n (perfectly diversified) to 1 (concentrated)
    // Higher HHI = higher concentration = higher risk
    return hhi * 10;
  }

  private calculateLiquidityRisk(protocols: StakingProtocol[]): number {
    // Average withdrawal delay weighted by allocation
    const totalStaked = protocols.reduce(
      (sum, p) => sum + Number(p.totalStaked),
      0
    );

    if (totalStaked === 0) return 0;

    let weightedDelay = 0;
    for (const protocol of protocols) {
      const weight = Number(protocol.totalStaked) / totalStaked;
      weightedDelay += protocol.withdrawalDelay * weight;
    }

    // Convert days to risk score (max 10 for 30+ days)
    return Math.min(weightedDelay / 3, 10);
  }

  private calculateSmartContractRisk(protocols: StakingProtocol[]): number {
    // Average smart contract risk weighted by allocation
    const totalStaked = protocols.reduce(
      (sum, p) => sum + Number(p.totalStaked),
      0
    );

    if (totalStaked === 0) return 0;

    let weightedRisk = 0;
    for (const protocol of protocols) {
      const weight = Number(protocol.totalStaked) / totalStaked;

      // Base smart contract risk factors
      let contractRisk = 2; // Base risk

      // Adjust based on protocol maturity
      if (protocol.name === "lido")
        contractRisk = 1; // Most mature
      else if (protocol.name === "rocketpool") contractRisk = 1.5;
      else if (protocol.name === "etherfi") contractRisk = 2.5;
      else if (protocol.name === "morpho") contractRisk = 3; // Newest/most complex

      weightedRisk += contractRisk * weight;
    }

    return weightedRisk;
  }

  private calculateOverallRisk(
    averageRisk: number,
    concentrationRisk: number,
    liquidityRisk: number,
    smartContractRisk: number
  ): number {
    // Weighted combination of risk factors
    const weights = {
      protocol: 0.4,
      concentration: 0.2,
      liquidity: 0.2,
      smartContract: 0.2,
    };

    return (
      averageRisk * weights.protocol +
      concentrationRisk * weights.concentration +
      liquidityRisk * weights.liquidity +
      smartContractRisk * weights.smartContract
    );
  }

  private generateRecommendations(
    overallRisk: number,
    concentrationRisk: number,
    liquidityRisk: number,
    smartContractRisk: number,
    protocols: StakingProtocol[]
  ): string[] {
    const recommendations: string[] = [];

    // Overall risk recommendations
    if (overallRisk > 7) {
      recommendations.push(
        "High risk detected - consider reducing position sizes"
      );
    } else if (overallRisk > 5) {
      recommendations.push("Moderate risk - monitor positions closely");
    } else if (overallRisk < 2) {
      recommendations.push(
        "Very low risk - consider taking on more yield opportunities"
      );
    }

    // Concentration risk
    if (concentrationRisk > 6) {
      recommendations.push(
        "Portfolio too concentrated - diversify across more protocols"
      );
    }

    // Liquidity risk
    if (liquidityRisk > 5) {
      recommendations.push(
        "High liquidity risk - increase allocation to protocols with shorter withdrawal delays"
      );
    }

    // Smart contract risk
    if (smartContractRisk > 6) {
      recommendations.push(
        "High smart contract risk - reduce exposure to newer protocols"
      );
    }

    // Protocol-specific recommendations
    const highRiskProtocols = protocols.filter(
      (p) => this.calculateProtocolRisk(p) > 7
    );
    if (highRiskProtocols.length > 0) {
      recommendations.push(
        `Consider reducing exposure to high-risk protocols: ${highRiskProtocols.map((p) => p.name).join(", ")}`
      );
    }

    // Allocation recommendations
    const totalStaked = protocols.reduce(
      (sum, p) => sum + Number(p.totalStaked),
      0
    );
    if (totalStaked > 0) {
      for (const protocol of protocols) {
        const allocation = Number(protocol.totalStaked) / totalStaked;
        if (allocation > protocol.maxAllocation / 100) {
          recommendations.push(
            `${protocol.name} allocation (${(allocation * 100).toFixed(1)}%) exceeds recommended maximum (${protocol.maxAllocation}%)`
          );
        }
      }
    }

    return recommendations;
  }

  async calculateVaR(
    portfolioValue: number,
    timeHorizon: number = 1, // days
    confidenceLevel: number = 0.95
  ): Promise<number> {
    // Simplified VaR calculation
    // In production, would use historical data and Monte Carlo simulation

    const annualVolatility = 0.15; // 15% annual volatility for ETH staking
    const dailyVolatility = annualVolatility / Math.sqrt(365);
    const scaledVolatility = dailyVolatility * Math.sqrt(timeHorizon);

    // Z-score for confidence level (1.65 for 95%)
    const zScore =
      confidenceLevel === 0.95
        ? 1.65
        : confidenceLevel === 0.99
          ? 2.33
          : confidenceLevel === 0.9
            ? 1.28
            : 1.65;

    return portfolioValue * scaledVolatility * zScore;
  }

  async stressTest(
    protocols: StakingProtocol[],
    scenarios: Array<{ name: string; impact: Map<string, number> }>
  ): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    for (const scenario of scenarios) {
      let totalImpact = 0;
      let totalStaked = protocols.reduce(
        (sum, p) => sum + Number(p.totalStaked),
        0
      );

      for (const protocol of protocols) {
        const allocation = Number(protocol.totalStaked) / totalStaked;
        const protocolImpact = scenario.impact.get(protocol.name) || 0;
        totalImpact += allocation * protocolImpact;
      }

      results.set(scenario.name, totalImpact);
    }

    return results;
  }

  async assessRisk(allocations: Map<string, number>): Promise<RiskAssessment> {
    try {
      logger.info("Assessing portfolio risk");

      // Mock risk assessment
      const protocolRisks = new Map([
        ["lido", 0.01], // 1% annual risk
        ["rocketpool", 0.02], // 2% annual risk
        ["etherfi", 0.015], // 1.5% annual risk
        ["morpho", 0.005], // 0.5% annual risk
      ]);

      // Calculate weighted risk
      let weightedRisk = 0;
      let totalWeight = 0;

      for (const [protocol, allocation] of allocations) {
        const risk = protocolRisks.get(protocol) || 0.01;
        weightedRisk += (allocation / 100) * risk;
        totalWeight += allocation;
      }

      const overallRisk =
        totalWeight > 0 ? (weightedRisk / totalWeight) * 100 : 1;

      // Calculate concentration risk
      const maxAllocation = Math.max(...allocations.values());
      const concentrationRisk =
        maxAllocation > 50 ? (maxAllocation - 50) / 10 : 0;

      const riskAssessment: RiskAssessment = {
        overallRisk: overallRisk + concentrationRisk,
        protocolRisks,
        concentrationRisk,
        liquidityRisk: 0.5, // mock
        smartContractRisk: 1.0, // mock
        recommendations: [
          "Maintain current diversification strategy",
          "Monitor protocol health indicators",
          "Consider reducing exposure if any protocol exceeds 40%",
        ],
      };

      return riskAssessment;
    } catch (error) {
      logger.error("Risk assessment failed:", error);
      throw error;
    }
  }

  async getProtocolRisk(protocol: string): Promise<number> {
    const risks: Record<string, number> = {
      lido: 1.0,
      rocketpool: 1.5,
      etherfi: 2.0,
      morpho: 3.0,
    };

    return risks[protocol] || 2.0;
  }

  async checkSlashingRisk(protocol: string): Promise<number> {
    // Mock slashing risk assessment
    const slashingRisks: Record<string, number> = {
      lido: 0.01,
      rocketpool: 0.02,
      etherfi: 0.015,
      morpho: 0.005,
    };

    return slashingRisks[protocol] || 0.01;
  }
}
