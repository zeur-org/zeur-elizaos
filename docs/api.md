# Zeur Yield Optimizer Agent - API Reference

## Overview

The Zeur Yield Optimizer Agent provides a comprehensive API for programmatic interaction with the yield optimization system. The API is built on the ElizaOS framework and supports both natural language interactions and structured data queries.

## 🔌 Connection & Authentication

### Runtime Configuration

```typescript
import { AgentRuntime, ModelProviderName } from "@elizaos/core";
import { YieldOptimizerCharacter } from "./character.js";
import { ZeurPlugin } from "./plugins/zeur-plugin.js";

const runtime = new AgentRuntime({
  character: YieldOptimizerCharacter,
  databaseAdapter,
  plugins: [ZeurPlugin],
  token: process.env.OPENAI_API_KEY,
  serverUrl: process.env.SERVER_URL || "http://localhost:7998",
  modelProvider: ModelProviderName.OPENAI,
  cacheManager,
});
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Optional
SERVER_URL=http://localhost:7998
LOG_LEVEL=info
MAX_GAS_PRICE_GWEI=50
RISK_TOLERANCE=moderate
```

## 📡 Actions API

### Data Fetcher Action

**Action Name**: `DATA_FETCHER`

**Triggers**: `fetch`, `update`, `data`, `rates`, `market`, `sync`

```typescript
interface DataFetcherResponse {
  marketData: {
    gasPrice: {
      current: number;
      safe: number;
      fast: number;
      timestamp: Date;
    };
    ethPrice: {
      usd: number;
      change24h: number;
      timestamp: Date;
    };
    protocolData: {
      [protocol: string]: {
        apr: number;
        tvl: string;
        change24h: number;
      };
    };
  };
  timestamp: string;
  nextUpdate: string;
}
```

**Example Usage**:

```typescript
// Natural language
await runtime.processMessage({
  content: { text: "Update market data" },
  userId: "user123",
});

// Returns current gas prices, ETH price, and protocol APRs
```

### Position Manager Action

**Action Name**: `POSITION_MANAGER`

**Triggers**: `position`, `allocation`, `balance`, `portfolio`, `holdings`

```typescript
interface PositionManagerResponse {
  positions: Array<[string, PortfolioPosition]>;
  strategy: OptimizationStrategy;
  timestamp: string;
}

interface PortfolioPosition {
  protocol: StakingProtocol;
  currentAmount: bigint;
  targetAmount: bigint;
  currentPercentage: number;
  targetPercentage: number;
  lstTokenBalance: bigint;
  pendingWithdrawals: bigint;
}
```

**Example Usage**:

```typescript
await runtime.processMessage({
  content: { text: "Show me my current positions" },
  userId: "user123",
});
```

### Yield Analytics Action

**Action Name**: `YIELD_ANALYTICS`

**Triggers**: `performance`, `yield`, `analytics`, `metrics`, `report`, `track`

```typescript
interface YieldAnalyticsResponse {
  analytics: {
    portfolio: {
      totalValue: string;
      currentAPR: number;
      estimatedAnnualReturn: string;
      sharpeRatio: number;
      maxDrawdown: number;
      volatility: number;
    };
    timeframes: {
      [period: string]: {
        return: number;
        benchmark: number;
      };
    };
    protocolPerformance: {
      [protocol: string]: {
        allocation: number;
        apr: number;
        contribution: number;
      };
    };
    optimizationStats: {
      rebalanceCount: number;
      gasOptimizationSavings: string;
      successRate: number;
      avgExecutionTime: string;
    };
  };
  timestamp: string;
}
```

### Optimization Engine Action

**Action Name**: `OPTIMIZATION_ENGINE`

**Triggers**: `optimize`, `strategy`, `allocation`, `rebalance`, `calculate`, `analyze`

```typescript
interface OptimizationEngineResponse {
  currentStrategy: OptimizationStrategy;
  optimizedStrategy: OptimizationStrategy;
  marketData: {
    gasPrice: number;
    ethPrice: number;
    protocolAPRs: Array<[string, number]>;
    protocolRisks: Array<[string, number]>;
  };
  improvement: number;
  timestamp: string;
}

interface OptimizationStrategy {
  targetAllocations: Map<string, number>;
  expectedAPR: number;
  riskScore: number;
  rebalanceThreshold: number;
  maxGasPrice: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
}
```

### Rebalance Executor Action

**Action Name**: `REBALANCE_EXECUTOR`

**Triggers**: `execute`, `rebalance`, `trade`, `optimize`

```typescript
interface RebalanceExecutorResponse {
  execution: {
    status: "analyzing" | "executing" | "completed" | "failed";
    gasPrice: number;
    estimatedCost: string;
    transactions: Array<{
      id: string;
      action: string;
      amount: string;
      status: "pending" | "queued" | "completed" | "failed";
      gasEstimate: number;
    }>;
    estimatedCompletion: string;
    expectedImpact: string;
  };
  timestamp: string;
}
```

### Monitoring Action

**Action Name**: `MONITORING`

**Triggers**: `status`, `health`, `monitor`, `performance`, `metrics`, `logs`

```typescript
interface MonitoringResponse {
  systemMetrics: {
    uptime: string;
    lastRebalance: string;
    successfulTransactions: number;
    failedTransactions: number;
    totalGasSaved: string;
    averageExecutionTime: string;
    rpcStatus: string;
    contractsStatus: string;
    dataFeedStatus: string;
  };
  recentActivity: Array<{
    time: string;
    action: string;
    status: string;
  }>;
  timestamp: string;
}
```

## 🔍 Evaluators API

### Position Manager Evaluator

```typescript
interface PositionEvaluatorResult {
  body: {
    totalValue: string;
    allocationHealth: string;
    driftFromTarget: number;
    rebalanceRecommended: boolean;
    timestamp: string;
  };
  user: string;
  text: string;
}
```

### Yield Analytics Evaluator

```typescript
interface YieldEvaluatorResult {
  body: {
    currentAPR: number;
    benchmarkAPR: number;
    outperformance: number;
    riskAdjustedReturn: number;
    timestamp: string;
  };
  user: string;
  text: string;
}
```

### Risk Assessment Evaluator

```typescript
interface RiskEvaluatorResult {
  body: {
    overallRiskScore: number;
    riskLevel: string;
    protocolRisks: Record<string, number>;
    recommendations: string[];
    timestamp: string;
  };
  user: string;
  text: string;
}
```

## 📈 Providers API

### Gas Optimization Provider

```typescript
const gasData = await GasOptimizationProvider.get(runtime, message, state);
// Returns: "Gas optimization data: Current 42 gwei, optimal window in 2 hours. Potential savings: 0.12%"
```

### Protocol Data Provider

```typescript
const protocolData = await ProtocolDataProvider.get(runtime, message, state);
// Returns: "Protocol data updated: LIDO: 8.1% APR, $8.2B TVL, Risk: 1.2/10, ..."
```

### Performance Analytics Provider

```typescript
const analytics = await PerformanceAnalyticsProvider.get(
  runtime,
  message,
  state
);
// Returns: "Performance analytics: 8.2% APR (0.4% vs benchmark), Sharpe: 1.85, ..."
```

## 🛠️ Service Classes

### YieldOptimizer

```typescript
class YieldOptimizer {
  constructor(riskTolerance?: "conservative" | "moderate" | "aggressive");

  async optimizeAllocation(
    marketData: MarketData
  ): Promise<OptimizationStrategy>;
  async getCurrentPositions(): Promise<Map<string, PortfolioPosition>>;
  async executeRebalance(strategy: OptimizationStrategy): Promise<boolean>;
  async validateStrategy(strategy: OptimizationStrategy): Promise<boolean>;
}
```

### BlockchainService

```typescript
class BlockchainService {
  async getGasPrice(): Promise<number>;
  async getETHPrice(): Promise<number>;
  async getBlockNumber(): Promise<number>;
  async estimateGas(to: string, data: string, value?: bigint): Promise<bigint>;
  async executeStake(
    protocolName: string,
    amount: bigint
  ): Promise<string | null>;
  async executeUnstake(
    protocolName: string,
    amount: bigint
  ): Promise<string | null>;
}
```

### DataService

```typescript
class DataService {
  async getMarketData(): Promise<MarketData>;
  async getProtocolAPR(protocol: string): Promise<number>;
  async getProtocolTVL(protocol: string): Promise<string>;
  async getHistoricalData(protocol: string, timeframe: string): Promise<any[]>;
}
```

### RiskAnalyzer

```typescript
class RiskAnalyzer {
  async assessRisk(allocations: Map<string, number>): Promise<RiskAssessment>;
  async getProtocolRisk(protocol: string): Promise<number>;
  async checkSlashingRisk(protocol: string): Promise<number>;
}
```

## 📊 Type Definitions

### Core Types

```typescript
interface StakingProtocol {
  name: string;
  address: string;
  type: "lido" | "etherfi" | "rocketpool" | "morpho";
  currentAPR: number;
  exchangeRate: number;
  totalStaked: bigint;
  riskScore: number;
  gasEfficiency: number;
  withdrawalDelay: number;
  maxAllocation: number;
}

interface MarketData {
  gasPrice: number;
  ethPrice: number;
  protocolAPRs: Map<string, number>;
  protocolRisks: Map<string, number>;
  timestamp: Date;
}

interface RiskAssessment {
  overallRisk: number;
  protocolRisks: Map<string, number>;
  concentrationRisk: number;
  liquidityRisk: number;
  smartContractRisk: number;
  recommendations: string[];
}
```

### Performance Types

```typescript
interface PerformanceMetrics {
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

interface RebalanceTransaction {
  id: string;
  fromProtocol: string;
  toProtocol: string;
  amount: bigint;
  gasPrice: number;
  estimatedGas: bigint;
  status: "pending" | "executing" | "completed" | "failed";
  txHash?: string;
  timestamp: Date;
}
```

## 🔧 Configuration API

### Runtime Configuration

```typescript
interface AgentConfig {
  riskTolerance: "conservative" | "moderate" | "aggressive";
  rebalanceFrequency: number; // hours
  minRebalanceThreshold: number; // percentage
  maxGasPrice: number; // gwei
  protocolAllocations: Record<string, number>;
  enabledProtocols: string[];
}
```

### Strategy Configuration

```typescript
interface StrategyConfig {
  targetAllocations: Map<string, number>;
  riskThresholds: {
    maxProtocolAllocation: number;
    maxTotalRisk: number;
    minLiquidity: number;
  };
  gasOptimization: {
    maxGasPrice: number;
    optimalWindow: number; // minutes
    urgencyThreshold: number;
  };
}
```

## 🚨 Error Handling

### Common Error Types

```typescript
enum ErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  GAS_PRICE_TOO_HIGH = "GAS_PRICE_TOO_HIGH",
  PROTOCOL_ERROR = "PROTOCOL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
}

interface APIError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    code?: number;
    details?: any;
  };
  timestamp: string;
}
```

## 📝 Usage Examples

### Basic Portfolio Query

```typescript
const response = await runtime.processMessage({
  content: { text: "What's my current portfolio?" },
  userId: "user123",
});

console.log(response.content);
// Output: Portfolio details with allocations and performance
```

### Execute Rebalancing

```typescript
const rebalanceResponse = await runtime.processMessage({
  content: { text: "Execute portfolio rebalance" },
  userId: "user123",
});

// Monitor execution progress
const statusResponse = await runtime.processMessage({
  content: { text: "Show rebalancing status" },
  userId: "user123",
});
```

### Custom Strategy

```typescript
// Configure custom strategy
const optimizer = new YieldOptimizer("aggressive");
const marketData = await dataService.getMarketData();
const strategy = await optimizer.optimizeAllocation(marketData);

console.log("Optimized allocations:", strategy.targetAllocations);
console.log("Expected APR:", strategy.expectedAPR);
```

---

_For complete API documentation with all endpoints and examples, refer to the inline TypeScript documentation in the source code._
