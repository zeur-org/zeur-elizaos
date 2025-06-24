import { Evaluator, IAgentRuntime, Memory, State } from "@elizaos/core";
import { logger } from "../utils/logger.js";

export const RiskAssessmentEvaluator: Evaluator = {
  name: "RISK_ASSESSMENT_EVALUATOR",
  similes: ["RISK_EVAL", "SAFETY_CHECK", "RISK_ANALYSIS"],
  description: "Evaluates portfolio risk and safety metrics",

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text.toLowerCase();
    return (
      text.includes("risk") ||
      text.includes("safety") ||
      text.includes("danger") ||
      text.includes("secure")
    );
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    try {
      logger.info("Risk assessment evaluator triggered");

      // Mock risk evaluation
      const evaluation = {
        overallRiskScore: 2.1,
        riskLevel: "Low",
        protocolRisks: {
          lido: 0.01,
          rocketpool: 0.02,
          etherfi: 0.015,
          morpho: 0.005,
        },
        recommendations: [
          "Maintain current diversification",
          "Monitor protocol updates",
        ],
        timestamp: new Date().toISOString(),
      };

      return {
        body: evaluation,
        user: message.userId,
        text: `Risk assessment: ${evaluation.riskLevel} (${evaluation.overallRiskScore}/10). All protocols within acceptable risk parameters.`,
      };
    } catch (error) {
      logger.error("Risk evaluator failed:", error);
      return null;
    }
  },

  examples: [],
};
