import { Client, GatewayIntentBits, Events, ActivityType } from 'discord.js';
import { CONFIG } from './config.js';
import { fetchUserDetails } from './services/userFetcher.js';
import { updateAndBroadcast } from './server.js';

/**
 * Bot Configuration Constants
 */
const BOT_CONSTANTS = {
    UPDATE_INTERVAL_MS: 10000,
    INITIAL_PRESENCE: {
        status: 'online',
        activities: [{ 
            name: 'System Status', 
            type: ActivityType.Custom 
        }]
    }
};

/**
 * Global State for tracked users and bots.
 */
const appState = {
    team: [],
    bots: [],
    lastUpdate: Date.now()
};

/**
 * Discord Client Initialization
 */
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

/**
 * Fetches details for a list of user IDs.
 * Filters out any failed fetches (null results).
 * 
 * @param {string[]} userIds - Array of Discord User IDs
 * @returns {Promise<Object[]>} Array of user detail objects
 */
const fetchUserList = async (userIds) => {
    if (!userIds || userIds.length === 0) return [];

    const promises = userIds.map(uid => fetchUserDetails(client, uid));
    const results = await Promise.all(promises);
    
    return results.filter(user => user !== null);
};

/**
 * Updates the application state by fetching latest data for Team and Bots.
 * Then broadcasts the new state to connected web clients.
 */
const refreshDashboardData = async () => {
    try {
        // Fetch data in parallel for efficiency
        const [teamData, botData] = await Promise.all([
            fetchUserList(CONFIG.TARGET_USER_IDS),
            fetchUserList(CONFIG.TARGET_BOT_IDS)
        ]);

        // Update State
        appState.team = teamData;
        appState.bots = botData;
        appState.lastUpdate = Date.now();

        // Broadcast to Web Clients
        updateAndBroadcast(appState);

    } catch (error) {
        console.error('❌ [Bot] Error refreshing dashboard data:', error);
    }
};

/**
 * Recursive loop to periodically update dashboard data.
 * Uses setTimeout to ensure the previous cycle completes before starting the next delay.
 */
const startUpdateLoop = async () => {
    await refreshDashboardData();
    setTimeout(startUpdateLoop, BOT_CONSTANTS.UPDATE_INTERVAL_MS);
};

/**
 * Event Handler: Executed when the bot successfully logs in.
 * @param {import('discord.js').Client} readyClient 
 */
const onClientReady = (readyClient) => {
    console.log(`✅ [Bot] Logged in as ${readyClient.user.tag}`);
    
    readyClient.user.setPresence(BOT_CONSTANTS.INITIAL_PRESENCE);
    
    // Start the data fetching loop
    startUpdateLoop();
};

/**
 * Main Entry Point: Starts the Discord Bot.
 */
export const startBot = async () => {
    if (!CONFIG.TOKEN) {
        console.warn('⚠️ [Bot] No token provided. Skipping bot startup.');
        return;
    }

    client.once(Events.ClientReady, onClientReady);
    
    try {
        await client.login(CONFIG.TOKEN);
    } catch (error) {
        console.error('❌ [Bot] Login failed:', error);
    }
};
