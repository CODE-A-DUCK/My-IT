/**
 * Application Entry Point
 * 
 * Orchestrates the initialization and startup of the Discord Bot 
 * and the companion Web Server.
 */

import { startBot } from './bot.js';
import { startServer } from './server.js';

/**
 * Bootstraps the application services.
 * Executes services in parallel and handles any fatal initialization errors.
 */
async function bootstrap() {
    console.log("🚀 [System] Initializing application services...");

    try {
        /**
         * We execute startBot and startServer in parallel.
         * Note: startServer (Bun.serve) is non-blocking, while startBot is async.
         */
        await Promise.all([
            startBot(),
            startServer()
        ]);

        console.log("✨ [System] All services are now running.");
    } catch (fatalError) {
        console.error("❌ [System] A fatal error occurred during startup:");
        console.error(fatalError);
        
        // Ensure the process exits on critical failure
        process.exit(1);
    }
}

// Execute the bootstrap process
bootstrap();