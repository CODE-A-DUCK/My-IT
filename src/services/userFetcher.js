import { Routes } from 'discord.js';
import { PROFILES as CUSTOM_PROFILES } from '../data/profiles.js';
import { CONFIG } from '../config.js';

/**
 * Service Constants
 */
const CONSTANTS = {
    CDN_BASE: 'https://cdn.discordapp.com',
    CACHE_TTL_MS: 5 * 60 * 1000, // 5 Minutes
    DEFAULT_BIO: "這個人很懶，什麼都沒寫。",
    DEFAULT_AVATAR: 'https://cdn.discordapp.com/embed/avatars/0.png',
    ACTIVITY_TYPES: [
        'Playing',
        'Streaming',
        'Listening',
        'Watching',
        'Custom',
        'Competing'
    ],
    PRIORITY_ACTIVITIES: ['Visual Studio Code', 'Spotify'],
    ACTIVITY_TYPE_CUSTOM: 4,
    DISCORD_ERROR_UNKNOWN_USER: 10013
};

/**
 * In-memory cache for static user data to prevent API Rate Limits.
 * @type {Map<string, {data: Object, timestamp: number}>}
 */
const userProfileCache = new Map();

/**
 * URL Generators
 */
const UrlGenerator = {
    avatar: (userId, hash) => 
        hash ? `${CONSTANTS.CDN_BASE}/avatars/${userId}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,
    
    defaultAvatar: (userId) => 
        `${CONSTANTS.CDN_BASE}/embed/avatars/${(BigInt(userId) >> 22n) % 6n}.png`,

    banner: (userId, hash) => 
        hash ? `${CONSTANTS.CDN_BASE}/banners/${userId}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null,

    decoration: (hash) => 
        hash ? `${CONSTANTS.CDN_BASE}/avatar-decoration-presets/${hash}.png?size=1024` : null
};

/**
 * Fetches static user data (username, avatar, bio) from Discord API or Cache.
 * @param {import('discord.js').Client} client 
 * @param {string} userId 
 * @returns {Promise<Object>} Raw user data from Discord API
 */
const fetchStaticUserProfile = async (client, userId) => {
    const cached = userProfileCache.get(userId);
    const isCacheValid = cached && (Date.now() - cached.timestamp < CONSTANTS.CACHE_TTL_MS);

    if (isCacheValid) {
        return cached.data;
    }

    const rawUser = await client.rest.get(Routes.user(userId));
    userProfileCache.set(userId, { data: rawUser, timestamp: Date.now() });
    return rawUser;
};

/**
 * Attempts to find a guild member object for the user to get real-time status.
 * Prioritizes the main configured guild, then falls back to any shared guild.
 * @param {import('discord.js').Client} client 
 * @param {string} userId 
 * @returns {Promise<import('discord.js').GuildMember|null>}
 */
const fetchActiveMemberStatus = async (client, userId) => {
    // 1. Try Main Configured Guild
    if (CONFIG.GUILD_ID) {
        const mainGuild = client.guilds.cache.get(CONFIG.GUILD_ID);
        if (mainGuild) {
            // Try cache first
            let member = mainGuild.members.cache.get(userId);
            if (member) return member;

            // Fetch if missing (soft fetch)
            try {
                member = await mainGuild.members.fetch({ user: userId, force: false });
                if (member) return member;
            } catch {
                // Ignore fetch errors, proceed to fallback
            }
        }
    }

    // 2. Fallback: Check ANY shared guild (Cache Only to avoid API spam)
    for (const guild of client.guilds.cache.values()) {
        const member = guild.members.cache.get(userId);
        if (member) return member;
    }

    return null;
};

/**
 * Resolves the user's primary activity for display.
 * @param {Array} activities 
 * @returns {Object|undefined}
 */
const resolveMainActivity = (activities) => {
    return activities.find(act => 
        CONSTANTS.PRIORITY_ACTIVITIES.includes(act.name) && act.type !== CONSTANTS.ACTIVITY_TYPE_CUSTOM
    ) || activities.find(act => act.type !== CONSTANTS.ACTIVITY_TYPE_CUSTOM);
};

/**
 * Formats the final user object for the frontend.
 * @param {Object} rawUser - Static data from Discord API
 * @param {import('discord.js').GuildMember|null} activeMember - Dynamic member data
 * @returns {Object} Normalized user object
 */
const formatUserResponse = (rawUser, activeMember) => {
    const presence = activeMember?.presence || {};
    const activities = presence.activities || [];
    
    // Status Logic
    const status = presence.status || 'offline';
    const customStatus = activities.find(act => act.type === CONSTANTS.ACTIVITY_TYPE_CUSTOM);
    const mainActivity = resolveMainActivity(activities);

    // Bio Logic
    const customBio = CUSTOM_PROFILES[rawUser.id]?.bio;
    const apiBio = rawUser.bio;
    const resolvedBio = (customBio || apiBio || CONSTANTS.DEFAULT_BIO).trim() || CONSTANTS.DEFAULT_BIO;

    // Color Logic
    const accentColor = rawUser.accent_color 
        ? `#${rawUser.accent_color.toString(16).padStart(6, '0')}` 
        : null;

    return {
        id: rawUser.id,
        username: rawUser.username,
        global_name: rawUser.global_name,
        bio: resolvedBio,
        banner_url: UrlGenerator.banner(rawUser.id, rawUser.banner),
        accent_color: accentColor,
        avatar_url: UrlGenerator.avatar(rawUser.id, rawUser.avatar) || UrlGenerator.defaultAvatar(rawUser.id),
        decoration_url: UrlGenerator.decoration(rawUser.avatar_decoration_data?.asset),
        profile_effect: rawUser.profile_effect_id,
        status: status,
        status_text: customStatus?.state,
        activities: mainActivity ? [{
            name: mainActivity.name,
            type: CONSTANTS.ACTIVITY_TYPES[mainActivity.type] || 'Activity',
            details: mainActivity.details,
            state: mainActivity.state
        }] : []
    };
};

/**
 * Generates a safe fallback object when fetching fails.
 * @param {string} userId 
 * @returns {Object} Fallback user object
 */
const getFallbackUser = (userId) => ({
    id: String(userId),
    username: "Unknown User",
    global_name: `ID: ${String(userId).slice(0, 4)}...`,
    bio: "User not found.",
    avatar_url: CONSTANTS.DEFAULT_AVATAR,
    status: 'offline',
    activities: []
});

/**
 * Main Service: Fetches and aggregates user details.
 * @param {import('discord.js').Client} client 
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const fetchUserDetails = async (client, userId) => {
    try {
        // Parallel-like execution conceptually, but sequential here for dependency
        // 1. Static Data (API/Cache)
        const rawUser = await fetchStaticUserProfile(client, userId);
        
        // 2. Dynamic Data (Guild Presence)
        const activeMember = await fetchActiveMemberStatus(client, userId);

        // 3. Merge and Format
        return formatUserResponse(rawUser, activeMember);

    } catch (error) {
        if (error.code !== CONSTANTS.DISCORD_ERROR_UNKNOWN_USER) {
            console.warn(`[Fetcher] Warning fetching ${userId}: ${error.message}`);
        }
        return getFallbackUser(userId);
    }
};