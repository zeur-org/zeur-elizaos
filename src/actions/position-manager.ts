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

export const PositionManagerAction: Action = {
  name: "POSITION_MANAGER",
  similes: [
    "CHECK_POSITIONS",
    "VIEW_PORTFOLIO",
    "TRACK_ALLOCATIONS",
    "POSITION_STATUS",
    "BALANCE_CHECK",
  ],
  description:
    "Manages and tracks DeFi position allocations across multiple staking protocols",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("position") ||
      text.includes("allocation") ||
      text.includes("balance") ||
      text.includes("portfolio") ||
      text.includes("holdings")
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
      logger.info("Position manager action triggered");

      const yieldOptimizer = new YieldOptimizer();
      const positions = yieldOptimizer.getPositions();
      const strategy = yieldOptimizer.getCurrentStrategy();

      let response = "📊 **Current Portfolio Positions**\n\n";

      if (positions.size === 0) {
        response +=
          "No positions currently tracked. Initializing portfolio monitoring...";
        // Could trigger initialization here
      } else {
        response += "**Protocol Allocations:**\n";

        for (const [protocolName, position] of positions) {
          const currentPct = position.currentPercentage.toFixed(1);
          const targetPct = position.targetPercentage.toFixed(1);
          const amount = position.currentAmount.toString();

          response += `• **${protocolName.toUpperCase()}**: ${currentPct}% (target: ${targetPct}%)\n`;
          response += `  Amount: ${amount} ETH\n`;
          response += `  APR: ${position.protocol.currentAPR.toFixed(2)}%\n\n`;
        }

        response += `**Strategy Summary:**\n`;
        response += `• Expected APR: ${strategy.expectedAPR.toFixed(2)}%\n`;
        response += `• Risk Score: ${strategy.riskScore.toFixed(1)}/10\n`;
        response += `• Rebalance Threshold: ${(strategy.rebalanceThreshold * 100).toFixed(1)}%\n`;
        response += `• Max Gas Price: ${strategy.maxGasPrice} gwei\n`;
      }

      if (callback) {
        callback({
          text: response,
          content: {
            positions: Array.from(positions.entries()),
            strategy,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      logger.error("Position manager action failed:", error);

      if (callback) {
        callback({
          text: "❌ Failed to retrieve position information. Please check system logs.",
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
        content: { text: "Show me my current positions" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "📊 Current Portfolio: 35% Lido (stETH), 25% Rocket Pool (rETH), 25% EtherFi (eETH), 15% Morpho (mWETH). Total value: 12.5 ETH. Expected APR: 8.2%. All positions within target ranges.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What's my portfolio allocation?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Current allocation vs targets: Lido 36.2% (target 35%), Rocket Pool 24.1% (target 25%), EtherFi 26.3% (target 25%), Morpho 13.4% (target 15%). Minor rebalancing may be beneficial.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Check my DeFi balances" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "💰 Portfolio Summary: Total value 18.7 ETH across 4 protocols. Lido: 6.8 ETH (8.1% APR), Rocket Pool: 4.5 ETH (7.9% APR), EtherFi: 4.9 ETH (8.4% APR), Morpho: 2.5 ETH (9.2% APR). Weighted APR: 8.3%",
        },
      },
    ],
  ] as ActionExample[][],
};
