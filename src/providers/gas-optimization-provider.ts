import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { logger } from "../utils/logger.js";

export const GasOptimizationProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      logger.info("Gas optimization provider triggered");

      // Mock gas optimization data
      const gasData = {
        currentGasPrice: 42,
        safeGasPrice: 38,
        fastGasPrice: 45,
        optimizedGasPrice: 35,
        nextOptimalWindow: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedSavings: 0.12,
        recommendation: "wait",
        confidence: 0.85,
      };

      return `Gas optimization data: Current ${gasData.currentGasPrice} gwei, optimal window in ${Math.round((gasData.nextOptimalWindow.getTime() - Date.now()) / (1000 * 60 * 60))} hours. Potential savings: ${gasData.estimatedSavings}%`;
    } catch (error) {
      logger.error("Gas optimization provider failed:", error);
      return null;
    }
  },
};
