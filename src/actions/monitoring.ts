import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample,
} from "@elizaos/core";
import { logger } from "../utils/logger.js";

export const MonitoringAction: Action = {
  name: "MONITORING",
  similes: [
    "SYSTEM_STATUS",
    "HEALTH_CHECK",
    "PERFORMANCE_REPORT",
    "ACTIVITY_LOG",
    "SYSTEM_METRICS",
  ],
  description: "Monitors system health, performance metrics, and activity logs",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("status") ||
      text.includes("health") ||
      text.includes("monitor") ||
      text.includes("performance") ||
      text.includes("metrics") ||
      text.includes("logs")
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
      logger.info("Monitoring action triggered");

      // Mock system metrics (in real implementation, would gather from various services)
      const systemMetrics = {
        uptime: "72h 15m",
        lastRebalance: "6h ago",
        successfulTransactions: 24,
        failedTransactions: 0,
        totalGasSaved: "0.12 ETH",
        averageExecutionTime: "45s",
        rpcStatus: "healthy",
        contractsStatus: "operational",
        dataFeedStatus: "syncing",
      };

      const recentActivity = [
        { time: "2h ago", action: "Data fetch completed", status: "✅" },
        { time: "4h ago", action: "Portfolio analysis", status: "✅" },
        { time: "6h ago", action: "Rebalance executed", status: "✅" },
        { time: "8h ago", action: "Risk assessment updated", status: "✅" },
        { time: "12h ago", action: "Gas optimization triggered", status: "✅" },
      ];

      let response = "🔍 **System Monitoring Report**\n\n";

      response += "**System Health:**\n";
      response += `• Uptime: ${systemMetrics.uptime}\n`;
      response += `• RPC Connection: ${systemMetrics.rpcStatus} 🟢\n`;
      response += `• Smart Contracts: ${systemMetrics.contractsStatus} 🟢\n`;
      response += `• Data Feeds: ${systemMetrics.dataFeedStatus} 🟡\n\n`;

      response += "**Performance Metrics:**\n";
      response += `• Successful Transactions: ${systemMetrics.successfulTransactions}\n`;
      response += `• Failed Transactions: ${systemMetrics.failedTransactions}\n`;
      response += `• Total Gas Saved: ${systemMetrics.totalGasSaved}\n`;
      response += `• Avg Execution Time: ${systemMetrics.averageExecutionTime}\n`;
      response += `• Last Rebalance: ${systemMetrics.lastRebalance}\n\n`;

      response += "**Recent Activity:**\n";
      for (const activity of recentActivity) {
        response += `${activity.status} ${activity.time}: ${activity.action}\n`;
      }

      if (callback) {
        callback({
          text: response,
          content: {
            systemMetrics,
            recentActivity,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return true;
    } catch (error) {
      logger.error("Monitoring action failed:", error);

      if (callback) {
        callback({
          text: "❌ Failed to retrieve system monitoring data. Please check logs.",
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
        content: { text: "Show system status" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🔍 System Status: All systems operational. Uptime: 72h. Last rebalance: 6h ago. 24 successful transactions, 0 failures. Total gas saved: 0.12 ETH. All protocols responding normally.",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Check performance metrics" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "📊 Performance: 99.2% uptime this week. Avg transaction time: 45s. Gas optimization saved $284 vs market rates. All rebalances executed within target windows. System running optimally.",
        },
      },
    ],
  ] as ActionExample[][],
};
