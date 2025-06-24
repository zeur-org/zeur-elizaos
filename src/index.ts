import {
  AgentRuntime,
  ModelProviderName,
  CacheManager,
  MemoryCacheAdapter,
  DatabaseAdapter,
} from "@elizaos/core";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import { YieldOptimizerCharacter } from "./character.js";
import { ZeurPlugin } from "./plugins/zeur-plugin.js";
import { logger } from "./utils/logger.js";

dotenv.config();

async function main() {
  try {
    logger.info("Starting Zeur Yield Optimizer Agent...");

    // Initialize database
    const db = new Database("agent.db");
    const databaseAdapter = new SqliteDatabaseAdapter(db);
    await databaseAdapter.init();

    // Initialize cache manager
    const cacheAdapter = new MemoryCacheAdapter();
    const cacheManager = new CacheManager(cacheAdapter);

    // Create agent runtime with custom character
    const runtime = new AgentRuntime({
      character: YieldOptimizerCharacter,
      databaseAdapter,
      plugins: [ZeurPlugin],
      token: process.env.OPENAI_API_KEY || "",
      serverUrl: process.env.SERVER_URL || "http://localhost:7998",
      modelProvider: ModelProviderName.OPENAI,
      cacheManager,
    });

    logger.info("Zeur Yield Optimizer Agent is now running!");

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      logger.info("Shutting down gracefully...");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start agent:", error);
    process.exit(1);
  }
}

main().catch(console.error);
