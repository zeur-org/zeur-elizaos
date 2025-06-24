import { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";
import { logger } from "../utils/logger.js";

export const PositionManagerEvaluator: Evaluator = {
  name: "POSITION_MANAGER_EVALUATOR",
  similes: ["POSITION_EVAL", "BALANCE_CHECK", "ALLOCATION_REVIEW"],
  description: "Evaluates portfolio positions and allocation health",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("position") ||
      text.includes("balance") ||
      text.includes("allocation") ||
      text.includes("portfolio")
    );
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      logger.info("Position manager evaluator triggered");

      // Mock position evaluation
      const evaluation = {
        totalValue: "1,245 ETH",
        allocationHealth: "Good",
        driftFromTarget: 2.3,
        rebalanceRecommended: false,
        timestamp: new Date().toISOString(),
      };

      return {
        body: evaluation,
        user: message.userId,
        text: `Portfolio positions evaluated. Total value: ${evaluation.totalValue}. Allocation drift: ${evaluation.driftFromTarget}%`,
      };
    } catch (error) {
      logger.error("Position evaluator failed:", error);
      return null;
    }
  },

  examples: [],
};
