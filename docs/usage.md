# Zeur Yield Optimizer Agent - Usage Guide

## Overview

The Zeur Yield Optimizer Agent is an advanced AI-powered DeFi yield optimization system built on the ElizaOS framework. It automatically manages portfolio positions across multiple Ethereum staking protocols (Lido, EtherFi, Rocket Pool, Morpho) to maximize yield while managing risk.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Basic understanding of DeFi and Ethereum staking

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/zeur-elizaos.git
cd zeur-elizaos

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file from the example:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# AI Model Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
SERVER_URL=http://localhost:7998

# Blockchain Configuration
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key_here
WALLET_ADDRESS=your_wallet_address_here

# Agent Configuration
AGENT_NAME=ZeurYieldOptimizer
REBALANCE_FREQUENCY_HOURS=24
MIN_REBALANCE_THRESHOLD=0.05
MAX_GAS_PRICE_GWEI=50
RISK_TOLERANCE=moderate

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/agent.log
```

### 3. Build and Run

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Or run in production
npm start
```

## 🔧 Configuration Options

### Risk Tolerance Levels

- **Conservative**: Lower risk, more stable returns
- **Moderate**: Balanced risk/reward (default)
- **Aggressive**: Higher risk, potentially higher returns

### Gas Price Management

- `MAX_GAS_PRICE_GWEI`: Maximum gas price for transactions
- `MIN_REBALANCE_THRESHOLD`: Minimum drift before rebalancing

### Protocol Settings

The agent supports these staking protocols:

- **Lido (stETH)**: Most established, highest TVL
- **EtherFi (eETH)**: Growing protocol with competitive rates
- **Rocket Pool (rETH)**: Decentralized staking solution
- **Morpho**: DeFi lending protocol with higher yields

## 💬 Agent Interactions

### Basic Commands

The agent responds to natural language commands:

#### Portfolio Management

```
"Show me my current positions"
"What's my portfolio allocation?"
"Check my DeFi balances"
```

#### Market Data

```
"Update market data"
"Get latest protocol rates"
"Show gas prices"
```

#### Optimization

```
"Optimize my portfolio allocation"
"Should I rebalance now?"
"Analyze current market strategy"
```

#### Performance Analytics

```
"Show performance analytics"
"Track my yield performance"
"What's my ROI?"
```

#### System Monitoring

```
"Show system status"
"Check performance metrics"
"Display recent activity"
```

### Example Conversations

**Portfolio Check:**

```
User: "Show me my current positions"
Agent: "📊 Current Portfolio: 35% Lido (stETH), 25% Rocket Pool (rETH), 25% EtherFi (eETH), 15% Morpho (mWETH). Total value: 12.5 ETH. Expected APR: 8.2%. All positions within target ranges."
```

**Rebalancing Decision:**

```
User: "Should I rebalance now?"
Agent: "Analysis suggests waiting 6 hours. Current gas price is 45 gwei (above our 35 gwei threshold), and Rocket Pool APR increased 0.3% in the last 4 hours. Expected savings from delayed execution: ~0.12% of total position value."
```

## 🔄 Automated Features

### Continuous Monitoring

- Real-time APR tracking across all protocols
- Gas price monitoring for optimal transaction timing
- Risk assessment and portfolio health checks

### Intelligent Rebalancing

- Automatic rebalancing when drift exceeds thresholds
- Gas optimization for cost-effective transactions
- Risk-adjusted allocation recommendations

### Performance Analytics

- Yield tracking vs benchmarks
- Gas cost optimization metrics
- Historical performance analysis

## 📊 Dashboard Features

### Portfolio Overview

- Current allocations vs targets
- Total portfolio value
- Expected annual returns
- Risk assessment scores

### Market Intelligence

- Real-time protocol APRs
- Gas price trends
- Market opportunities

### Transaction History

- Rebalancing events
- Gas costs and savings
- Performance impact

## 🛠️ Advanced Configuration

### Custom Strategy Parameters

Edit the agent configuration for custom strategies:

```typescript
// In src/services/yield-optimizer.ts
const strategy: OptimizationStrategy = {
  targetAllocations: new Map([
    ["lido", 40], // 40% allocation
    ["etherfi", 30], // 30% allocation
    ["rocketpool", 20], // 20% allocation
    ["morpho", 10], // 10% allocation
  ]),
  riskTolerance: "moderate",
  rebalanceThreshold: 0.02, // 2% drift
  maxGasPrice: 45,
};
```

### Protocol Risk Profiles

Customize risk assessments:

```typescript
// In src/services/risk-analyzer.ts
const protocolRisks = new Map([
  ["lido", 1.0], // Lowest risk
  ["rocketpool", 1.5], // Low risk
  ["etherfi", 2.0], // Medium risk
  ["morpho", 3.0], // Higher risk
]);
```

## 🔐 Security Considerations

### Private Key Management

- Store private keys securely
- Use hardware wallets for production
- Consider multi-sig setups for large amounts

### Smart Contract Risks

- Each protocol has inherent smart contract risks
- Agent performs continuous risk assessment
- Diversification reduces concentration risk

### Gas Management

- Set appropriate gas limits
- Monitor for unusual gas consumption
- Use gas optimization features

## 📈 Performance Optimization

### Best Practices

1. **Regular Monitoring**: Check agent performance weekly
2. **Gas Efficiency**: Let the agent optimize gas timing
3. **Risk Management**: Adjust risk tolerance based on market conditions
4. **Rebalancing**: Don't override automatic rebalancing without good reason

### Performance Metrics

- **Sharpe Ratio**: Risk-adjusted returns
- **APR vs Benchmark**: Outperformance tracking
- **Gas Efficiency**: Cost optimization metrics
- **Maximum Drawdown**: Risk measurement

## 🐛 Troubleshooting

### Common Issues

**Agent Won't Start**

```bash
# Check dependencies
npm install

# Verify environment variables
cat .env

# Check logs
tail -f logs/agent.log
```

**RPC Connection Issues**

```bash
# Test RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $RPC_URL
```

**Gas Price Too High**

```bash
# Adjust gas threshold in .env
MAX_GAS_PRICE_GWEI=60
```

### Log Analysis

Monitor logs for insights:

```bash
# Real-time monitoring
tail -f logs/agent.log

# Error filtering
grep "ERROR" logs/agent.log

# Performance metrics
grep "rebalance\|optimization" logs/agent.log
```

## 🆘 Support

### Documentation

- [API Reference](./api.md)
- [Functionality List](./functionalities.md)
- [Architecture Overview](./architecture.md)

### Community

- Discord: [Zeur Protocol Discord]
- GitHub Issues: [Report bugs and feature requests]
- Documentation: [Extended documentation]

### Emergency Procedures

**Emergency Stop**
If you need to halt operations immediately:

```bash
# Stop the agent
npm run stop

# Or kill the process
pkill -f "zeur-elizaos"
```

**Manual Override**
For emergency rebalancing or withdrawals, use the blockchain service directly or interact with contracts manually.

---

_For more advanced usage and API documentation, see the additional files in this docs folder._
