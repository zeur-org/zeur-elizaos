export interface StakingProtocol {
    name: string;
    address: string;
    type: 'lido' | 'etherfi' | 'rocketpool' | 'morpho';
    currentAPR: number;
    exchangeRate: number;
    totalStaked: bigint;
    riskScore: number;
    gasEfficiency: number;
    withdrawalDelay: number; // in hours
    maxAllocation: number; // percentage
}

export interface PortfolioPosition {
    protocol: StakingProtocol;
    currentAmount: bigint;
    targetAmount: bigint;
    currentPercentage: number;
    targetPercentage: number;
    lstTokenBalance: bigint;
    pendingWithdrawals: bigint;
}

export interface OptimizationStrategy {
    targetAllocations: Map<string, number>; // protocol name -> percentage
    expectedAPR: number;
    riskScore: number;
    rebalanceThreshold: number;
    maxGasPrice: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface MarketData {
    gasPrice: number;
    ethPrice: number;
    protocolAPRs: Map<string, number>;
    protocolRisks: Map<string, number>;
    timestamp: Date;
}

export interface RebalanceTransaction {
    id: string;
    fromProtocol: string;
    toProtocol: string;
    amount: bigint;
    gasPrice: number;
    estimatedGas: bigint;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    txHash?: string;
    timestamp: Date;
}

export interface PerformanceMetrics {
    totalValue: bigint;
    currentAPR: number;
    performanceVsBenchmark: number;
    totalFeesEarned: bigint;
    totalGasSpent: bigint;
    rebalanceCount: number;
    sharpeRatio: number;
    maxDrawdown: number;
    timeRange: string;
}

export interface RiskAssessment {
    overallRisk: number;
    protocolRisks: Map<string, number>;
    concentrationRisk: number;
    liquidityRisk: number;
    smartContractRisk: number;
    recommendations: string[];
}

export interface GasOptimization {
    currentGasPrice: number;
    recommendedGasPrice: number;
    optimalExecutionTime: Date;
    expectedSavings: number;
    urgencyScore: number;
}

export interface AlertConfig {
    riskThreshold: number;
    performanceThreshold: number;
    gasThreshold: number;
    rebalanceFrequency: number; // hours
    enableEmergencyStop: boolean;
} 