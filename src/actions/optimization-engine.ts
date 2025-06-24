import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample,
} from "@elizaos/core";
import { YieldOptimizer } from "../services/yield-optimizer.js";
import { logger } from "../utils/logger.js";

export const OptimizationEngineAction: Action = {
  name: "OPTIMIZATION_ENGINE",
  similes: [
    "OPTIMIZE_PORTFOLIO",
    "CALCULATE_STRATEGY",
    "ANALYZE_ALLOCATION",
    "RECOMMEND_REBALANCE",
    "STRATEGY_ANALYSIS",
  ],
  description:
    "Analyzes market conditions and calculates optimal yield strategies across protocols",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("optimize") ||
      text.includes("strategy") ||
      text.includes("allocation") ||
      text.includes("rebalance") ||
      text.includes("calculate") ||
      text.includes("analyze")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    try {
      logger.info("Optimization engine action triggered");

      const yieldOptimizer = new YieldOptimizer();
      const currentStrategy = yieldOptimizer.getCurrentStrategy();

      // Mock market data for demonstration (in real implementation, would fetch from DataService)
      const mockMarketData = {
        gasPrice: 35,
        ethPrice: 2300,
        protocolAPRs: new Map([
          ["lido", 8.1],
          ["rocketpool", 7.9],
          ["etherfi", 8.4],
          ["morpho", 9.2],
        ]),
        protocolRisks: new Map([
          ["lido", 1.0],
          ["rocketpool", 1.5],
          ["etherfi", 2.0],
          ["morpho", 3.0],
        ]),
        timestamp: new Date(),
      };

      const optimizedStrategy =
        await yieldOptimizer.optimizeAllocation(mockMarketData);

      let response = "🎯 **Portfolio Optimization Analysis**\n\n";

      response += "**Current vs Optimized Allocation:**\n";
      for (const [protocol, targetPct] of optimizedStrategy.targetAllocations) {
        const currentPct = currentStrategy.targetAllocations.get(protocol) || 0;
        const apr = mockMarketData.protocolAPRs.get(protocol) || 0;
        const risk = mockMarketData.protocolRisks.get(protocol) || 0;

        response += `• **${protocol.toUpperCase()}**: ${currentPct}% → ${targetPct.toFixed(1)}%\n`;
        response += `  APR: ${apr}% | Risk: ${risk}/10\n`;
      }

      response += `\n**Strategy Metrics:**\n`;
      response += `• Expected APR: ${currentStrategy.expectedAPR.toFixed(2)}% → ${optimizedStrategy.expectedAPR.toFixed(2)}%\n`;
      response += `• Risk Score: ${currentStrategy.riskScore.toFixed(1)} → ${optimizedStrategy.riskScore.toFixed(1)}\n`;
      response += `• Performance Improvement: ${(optimizedStrategy.expectedAPR - currentStrategy.expectedAPR).toFixed(2)}%\n`;

      response += `\n**Market Conditions:**\n`;
      response += `• Gas Price: ${mockMarketData.gasPrice} gwei\n`;
      response += `• ETH Price: $${mockMarketData.ethPrice.toLocaleString()}\n`;
      response += `• Rebalance Recommended: ${optimizedStrategy.expectedAPR > currentStrategy.expectedAPR ? "✅ Yes" : "❌ No"}\n`;

      if (callback) {
        callback({
          text: response,
          content: {
            currentStrategy,
            optimizedStrategy,
            marketData: {
              gasPrice: mockMarketData.gasPrice,
              ethPrice: mockMarketData.ethPrice,
              protocolAPRs: Array.from(mockMarketData.protocolAPRs.entries()),
              protocolRisks: Array.from(mockMarketData.protocolRisks.entries()),
            },
            improvement:
              optimizedStrategy.expectedAPR - currentStrategy.expectedAPR,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      logger.error("Optimization engine action failed:", error);

      if (callback) {
        callback({
          text: "❌ Failed to calculate optimization strategy. Please check system logs.",
          content: { error: (error as Error).message },
        });
      }

      return false;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Optimize my portfolio allocation" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎯 Optimization complete! Recommended: 32% Lido, 28% EtherFi, 24% Rocket Pool, 16% Morpho. Expected APR increase: +0.3% to 8.5%. Risk slightly reduced. Gas at 35 gwei - good time to rebalance.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Should I rebalance now?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Analysis: Current allocation is 2.1% off targets. EtherFi showing +0.4% APR advantage. Gas at 42 gwei (within threshold). Recommendation: Yes, rebalance expected to improve returns by 0.25% annually.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Analyze current market strategy" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "📊 Market Analysis: Morpho leading at 9.2% APR but higher risk. Lido most stable at 8.1%. Current strategy yielding 8.2% with 2.1/10 risk. Optimal rebalancing could achieve 8.4% with similar risk profile.",
        },
      },
    ],
  ] as ActionExample[][],
};
