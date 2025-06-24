import { createAgent, defaultCharacter } from '@elizaos/core';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import { DiscordClientInterface } from '@elizaos/client-discord';
import { TelegramClientInterface } from '@elizaos/client-telegram';
import dotenv from 'dotenv';
import { YieldOptimizerCharacter } from './character.js';
import { ZeurPlugin } from './plugins/zeur-plugin.js';
import { logger } from './utils/logger.js';

dotenv.config();

async function main() {
    try {
        logger.info('Starting Zeur Yield Optimizer Agent...');

        // Initialize database
        const db = new SqliteDatabaseAdapter(
            process.env.DATABASE_URL || './data/agent.db'
        );

        // Create agent with custom character
        const agent = createAgent({
            character: YieldOptimizerCharacter,
            db,
            plugins: [
                ZeurPlugin
            ]
        });

        // Initialize clients if tokens are provided
        const clients = [];

        if (process.env.DISCORD_API_TOKEN) {
            clients.push(
                new DiscordClientInterface({
                    token: process.env.DISCORD_API_TOKEN,
                    applicationId: process.env.DISCORD_APPLICATION_ID
                })
            );
        }

        if (process.env.TELEGRAM_BOT_TOKEN) {
            clients.push(
                new TelegramClientInterface({
                    token: process.env.TELEGRAM_BOT_TOKEN
                })
            );
        }

        // Start all clients
        for (const client of clients) {
            await client.start();
            logger.info(`Started ${client.constructor.name}`);
        }

        logger.info('Zeur Yield Optimizer Agent is now running!');

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('Shutting down gracefully...');
            for (const client of clients) {
                await client.stop();
            }
            process.exit(0);
        });

    } catch (error) {
        logger.error('Failed to start agent:', error);
        process.exit(1);
    }
}

main().catch(console.error); 