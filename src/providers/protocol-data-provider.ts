import { Provider, IAgentRuntime, Memory, State } from "@elizaos/core";
import { logger } from "../utils/logger.js";

export const ProtocolDataProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      logger.info("Protocol data provider triggered");

      // Mock protocol data
      const protocolData = {
        lido: {
          apr: 8.1,
          tvl: "8.2B",
          riskScore: 1.2,
          withdrawalDelay: 24,
          exchangeRate: 1.026,
        },
        rocketpool: {
          apr: 7.9,
          tvl: "1.8B",
          riskScore: 1.5,
          withdrawalDelay: 24,
          exchangeRate: 1.031,
        },
        etherfi: {
          apr: 8.4,
          tvl: "2.1B",
          riskScore: 1.8,
          withdrawalDelay: 72,
          exchangeRate: 1.028,
        },
        morpho: {
          apr: 9.2,
          tvl: "0.9B",
          riskScore: 2.1,
          withdrawalDelay: 0,
          exchangeRate: 1.034,
        },
      };

      return `Protocol data updated: ${Object.entries(protocolData)
        .map(
          ([name, data]) =>
            `${name.toUpperCase()}: ${data.apr}% APR, $${data.tvl} TVL, Risk: ${data.riskScore}/10`
        )
        .join(", ")}`;
    } catch (error) {
      logger.error("Protocol data provider failed:", error);
      return null;
    }
  },
};
