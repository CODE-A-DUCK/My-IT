import { Client, GatewayIntentBits, Events } from 'discord.js';
import { CONFIG } from './config.js';
import { fetchUserDetails } from './services/userFetcher.js';
import { updateAndBroadcast } from './server.js';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

const localStats = {
    team: [],
    bots: [],
    lastUpdate: Date.now()
};

export const startBot = async () => {
    if (!CONFIG.TOKEN) return;

    client.once(Events.ClientReady, c => {
        console.log(`✅ [Bot] Logged in as ${c.user.tag}`);
        client.user.setPresence({ status: 'online', activities: [{ name: 'System Status', type: 4 }] }); // Ensure visual online status
        updateLoop();
    });
    await client.login(CONFIG.TOKEN);
};

const updateLoop = async () => {
    const fetchList = async (ids) => (await Promise.all(ids.map(uid => fetchUserDetails(client, uid)))).filter(u => u !== null);

    if (CONFIG.TARGET_USER_IDS.length) localStats.team = await fetchList(CONFIG.TARGET_USER_IDS);
    if (CONFIG.TARGET_BOT_IDS.length) localStats.bots = await fetchList(CONFIG.TARGET_BOT_IDS);
    
    localStats.lastUpdate = Date.now();
    updateAndBroadcast(localStats);
    
    setTimeout(updateLoop, 10000);
};
