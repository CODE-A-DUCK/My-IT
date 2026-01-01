import { startBot } from './bot.js';
import { startServer } from './server.js';

console.log("Starting...");

Promise.all([startBot().catch(console.error), startServer()]);