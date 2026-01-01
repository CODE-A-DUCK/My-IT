import { Routes } from 'discord.js';
import { PROFILES as MEMBER_PROFILES } from '../data/profiles.js';
import { CONFIG } from '../config.js';

const CDN_BASE = 'https://cdn.discordapp.com';

const getAvatarUrl = (userId, hash) => 
    hash ? `${CDN_BASE}/avatars/${userId}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;

const getBannerUrl = (userId, hash) => 
    hash ? `${CDN_BASE}/banners/${userId}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;

const getDecorationUrl = (hash) => 
    hash ? `${CDN_BASE}/avatar-decoration-presets/${hash}.png?size=1024` : null;

// Cache for static user data (API heavy) to prevent Rate Limits (429s)
const userProfileCache = new Map();
const CACHE_TTL = 60 * 1000 * 5; // 5 Minutes Cache for static profile data

export const fetchUserDetails = async (client, userId) => {
    try {
        // 1. Fetch Static Data (Bio, Banner, Avatar) - Cached
        let rawUser = null;
        const cached = userProfileCache.get(userId);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            rawUser = cached.data;
        } else {
            // This is the expensive API call that causes 429s if spammed
            rawUser = await client.rest.get(Routes.user(userId));
            userProfileCache.set(userId, { data: rawUser, timestamp: Date.now() });
        }
        
        // 2. Fetch Dynamic Data (Presence/Status) - Optimized
        let activeMember = null;

        // Optimized: Check the main configured guild first
        if (CONFIG.GUILD_ID) {
            const guild = client.guilds.cache.get(CONFIG.GUILD_ID);
            if (guild) {
                // Try Cache First (Zero API calls)
                activeMember = guild.members.cache.get(userId);
                
                // Only fetch if missing and we really need to (without force: true to use internal cache if available)
                if (!activeMember) {
                    try { activeMember = await guild.members.fetch({ user: userId, force: false }); } catch {}
                }
            }
        }

        // Fallback: If not found in main guild, check ANY guild where the bot and user share membership
        // We only check cache here to avoid massive API spam across all guilds
        if (!activeMember) {
            for (const guild of client.guilds.cache.values()) {
                const m = guild.members.cache.get(userId);
                if (m) {
                    activeMember = m;
                    break; 
                }
            }
        }

        const presence = activeMember?.presence || {};
        const activities = presence.activities || [];
        const status = presence.status || 'offline';

        const customStatusActivity = activities.find(act => act.type === 4);
        const mainActivity = activities.find(act => ['Visual Studio Code', 'Spotify'].includes(act.name) && act.type !== 4) || activities.find(act => act.type !== 4);
        
        let bio = MEMBER_PROFILES[userId]?.bio || rawUser.bio;
        // Bot bio fetching is rare, can also cache or skip if risky
        if (rawUser.bot && !bio) {
             // Skip extra API call for bots to be safe, or cache it too. For now, use existing logic but careful.
             // We'll rely on the main userCache for bots too if possible, but application info is different.
             // Let's just use the profile bio if available.
        }
        
        const finalBio = (bio || "這個人很懶，什麼都沒寫。").trim() || "這個人很懶，什麼都沒寫。";

        return {
            id: rawUser.id,
            username: rawUser.username,
            global_name: rawUser.global_name,
            bio: finalBio,
            banner_url: getBannerUrl(rawUser.id, rawUser.banner),
            accent_color: rawUser.accent_color ? `#${rawUser.accent_color.toString(16).padStart(6, '0')}` : null,
            avatar_url: getAvatarUrl(rawUser.id, rawUser.avatar) || `${CDN_BASE}/embed/avatars/${(BigInt(rawUser.id) >> 22n) % 6n}.png`,
            decoration_url: getDecorationUrl(rawUser.avatar_decoration_data?.asset),
            profile_effect: rawUser.profile_effect_id,
            status: status,
            status_text: customStatusActivity?.state,
            activities: mainActivity ? [{
                name: mainActivity.name,
                type: ['Playing', 'Streaming', 'Listening', 'Watching', 'Custom', 'Competing'][mainActivity.type] || 'Activity',
                details: mainActivity.details,
                state: mainActivity.state
            }] : []
        };
    } catch (error) {
        if (error.code !== 10013) console.warn(`[Fetcher] Warning fetching ${userId}: ${error.message}`);
        
        return {
            id: String(userId),
            username: "Unknown User",
            global_name: `ID: ${String(userId).slice(0, 4)}...`,
            bio: "User not found.",
            avatar_url: `${CDN_BASE}/embed/avatars/0.png`,
            status: 'offline',
            activities: []
        };
    }
};