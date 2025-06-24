# Zeur Yield Optimizer Agent

An advanced AI agent built on ElizaOS that manages DeFi positions and optimizes yield strategies across multiple Ethereum staking protocols.

## Overview

The Zeur Yield Optimizer Agent is a sophisticated AI system designed to:

- **Position Management**: Track and manage vault balances across Lido, EtherFi, Rocket Pool, and Morpho protocols
- **Data Fetching**: Continuously gather APRs, gas prices, and cross-chain liquidity data
- **Yield Analytics**: Track performance, risk metrics, and apply auto-compounding strategies
- **Optimization Engine**: Simulate scenarios and calculate optimal asset allocations
- **Automated Execution**: Execute rebalancing transactions based on strategy
- **Monitoring & Logging**: Comprehensive system health and performance tracking

## Key Features

### 🎯 Intelligent Portfolio Optimization
- Risk-adjusted return calculations
- Dynamic allocation strategies based on market conditions
- Automated rebalancing with gas optimization
- Multi-protocol diversification

### 📊 Real-time Analytics
- Performance tracking vs benchmarks
- Sharpe ratio and risk metrics calculation
- Protocol-specific contribution analysis
- Gas efficiency monitoring

### ⚡ Automated Execution
- Smart gas price optimization
- Transaction batching and sequencing
- Emergency stop mechanisms
- Comprehensive error handling

### 🔍 Advanced Monitoring
- System health checks
- Transaction status tracking
- Performance alerts
- Detailed activity logs

## Architecture

```
src/
├── actions/           # ElizaOS actions for user interactions
├── evaluators/        # Decision-making logic
├── providers/         # Data and service providers
├── services/          # Core business logic
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Supported Protocols

- **Lido (stETH)**: Largest liquid staking protocol
- **EtherFi (eETH)**: Decentralized staking with restaking
- **Rocket Pool (rETH)**: Decentralized staking network
- **Morpho (mWETH)**: Lending protocol optimization

## Quick Start

### Prerequisites

- Node.js 18+
- Ethereum RPC provider (Alchemy, Infura, etc.)
- Discord/Telegram bot tokens (optional)

### Installation

1. Clone and install dependencies:
```bash
cd zeur-elizaos
npm install
```

2. Configure environment:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Build the project:
```bash
npm run build
```

4. Run the agent:
```bash
npm start
```

## Configuration

### Environment Variables

**Blockchain Configuration:**
- `RPC_URL`: Ethereum RPC endpoint
- `PRIVATE_KEY`: Wallet private key for transactions
- `VAULT_ETH_ADDRESS`: VaultETH contract address

**Protocol Addresses:**
- `STAKING_ROUTER_LIDO_ADDRESS`: Lido staking router
- `STAKING_ROUTER_ETHERFI_ADDRESS`: EtherFi staking router
- `STAKING_ROUTER_ROCKETPOOL_ADDRESS`: Rocket Pool staking router
- `STAKING_ROUTER_MORPHO_ADDRESS`: Morpho staking router

**Agent Settings:**
- `REBALANCE_FREQUENCY_HOURS`: Rebalancing frequency (default: 24)
- `MIN_REBALANCE_THRESHOLD`: Minimum threshold for rebalancing (default: 0.05)
- `MAX_GAS_PRICE_GWEI`: Maximum gas price for transactions (default: 50)
- `RISK_TOLERANCE`: Risk tolerance level (conservative/moderate/aggressive)

## Usage Examples

### Chat Commands

**Position Management:**
- "Show my current positions"
- "What's my portfolio allocation?"
- "Check my DeFi balances"

**Optimization:**
- "Optimize my portfolio allocation"
- "Should I rebalance now?"
- "Analyze current market strategy"

**Analytics:**
- "Show performance analytics"
- "Track my yield performance"
- "Generate yield report"

**Execution:**
- "Execute the rebalance"
- "Rebalance my portfolio now"

**Monitoring:**
- "Show system status"
- "Check performance metrics"
- "Update market data"

### API Integration

The agent can be integrated with:
- Discord servers
- Telegram groups
- Twitter for automated posting
- Custom webhooks

## Security Considerations

- **Private Key Management**: Store keys securely, use hardware wallets for production
- **Access Control**: Implement proper role-based access controls
- **Transaction Limits**: Set appropriate limits for automated transactions
- **Risk Management**: Monitor and limit exposure per protocol
- **Emergency Stops**: Implement circuit breakers for market volatility

## Risk Disclaimer

⚠️ **Important**: This agent interacts with DeFi protocols which carry inherent risks including:
- Smart contract bugs
- Protocol governance risks
- Market volatility
- Impermanent loss
- Gas cost volatility

Always:
- Test thoroughly on testnets first
- Start with small amounts
- Monitor positions actively
- Understand the risks of each protocol
- Keep emergency controls accessible

## Development

### Adding New Protocols

1. Create router contract interface in `src/interfaces/`
2. Add protocol configuration to `BlockchainService`
3. Update optimization algorithms in `YieldOptimizer`
4. Add protocol-specific actions and evaluators

### Custom Strategies

1. Extend `OptimizationStrategy` interface
2. Implement strategy in `YieldOptimizer`
3. Add strategy validation in evaluators
4. Create user-facing actions for strategy management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions:
- Open GitHub issues for bugs
- Join our Discord for community support
- Check documentation for detailed guides

---

**Disclaimer**: This software is provided as-is. Users are responsible for understanding the risks and properly configuring the system for their needs. 