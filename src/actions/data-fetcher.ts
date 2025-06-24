import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample,
} from "@elizaos/core";
import { logger } from "../utils/logger.js";

export const DataFetcherAction: Action = {
  name: "DATA_FETCHER",
  similes: [
    "FETCH_DATA",
    "UPDATE_RATES",
    "GET_MARKET_DATA",
    "SYNC_PROTOCOLS",
    "REFRESH_METRICS",
  ],
  description:
    "Fetches and updates market data, APRs, gas prices, and protocol information",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("fetch") ||
      text.includes("update") ||
      text.includes("data") ||
      text.includes("rates") ||
      text.includes("market") ||
      text.includes("sync")
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
      logger.info("Data fetcher action triggered");

      // Mock market data (in real implementation, would fetch from APIs)
      const marketData = {
        gasPrice: {
          current: 42,
          safe: 38,
          fast: 45,
          timestamp: new Date(),
        },
        ethPrice: {
          usd: 2340,
          change24h: 2.4,
          timestamp: new Date(),
        },
        protocolData: {
          lido: { apr: 8.1, tvl: "8.2B", change24h: 0.02 },
          rocketpool: { apr: 7.9, tvl: "1.8B", change24h: -0.01 },
          etherfi: { apr: 8.4, tvl: "2.1B", change24h: 0.15 },
          morpho: { apr: 9.2, tvl: "0.9B", change24h: 0.08 },
        },
      };

      let response = "📡 **Market Data Update**\n\n";

      response += "**Gas Prices:**\n";
      response += `• Current: ${marketData.gasPrice.current} gwei\n`;
      response += `• Safe: ${marketData.gasPrice.safe} gwei\n`;
      response += `• Fast: ${marketData.gasPrice.fast} gwei\n\n`;

      response += "**ETH Price:**\n";
      response += `• Price: $${marketData.ethPrice.usd.toLocaleString()}\n`;
      response += `• 24h Change: ${marketData.ethPrice.change24h > 0 ? "+" : ""}${marketData.ethPrice.change24h}%\n\n`;

      response += "**Protocol APRs & TVL:**\n";
      for (const [protocol, data] of Object.entries(marketData.protocolData)) {
        const changeIcon =
          data.change24h > 0 ? "📈" : data.change24h < 0 ? "📉" : "📊";
        response += `• **${protocol.toUpperCase()}**: ${data.apr}% APR | $${data.tvl} TVL ${changeIcon}\n`;
        response += `  24h APR change: ${data.change24h > 0 ? "+" : ""}${data.change24h}%\n`;
      }

      response += `\n**Data freshness:** Just updated\n`;
      response += `**Next update:** In 15 minutes`;

      if (callback) {
        callback({
          text: response,
          content: {
            marketData,
            timestamp: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      logger.error("Data fetcher action failed:", error);

      if (callback) {
        callback({
          text: "❌ Failed to fetch market data. Please check data sources and network connectivity.",
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
        content: { text: "Update market data" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "📡 Market update complete! Gas: 42 gwei. ETH: $2,340 (+2.4%). Top APRs: Morpho 9.2%, EtherFi 8.4%, Lido 8.1%, Rocket Pool 7.9%. All protocols showing healthy activity.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Get latest protocol rates" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "💹 Latest rates: Lido 8.1% (stable), Rocket Pool 7.9% (-0.1%), EtherFi 8.4% (+0.15%), Morpho 9.2% (+0.08%). Gas favorable at 38 gwei. Good conditions for potential rebalancing.",
        },
      },
    ],
  ] as ActionExample[][],
};
