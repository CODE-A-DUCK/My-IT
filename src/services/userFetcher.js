import { Routes } from 'discord.js';
import { PROFILES as MEMBER_PROFILES } from '../data/profiles.js';

const CDN_BASE = 'https://cdn.discordapp.com';

const getAvatarUrl = (userId, hash) => 
    hash ? `${CDN_BASE}/avatars/${userId}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;

const getBannerUrl = (userId, hash) => 
    hash ? `${CDN_BASE}/banners/${userId}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=1024` : null;

const getDecorationUrl = (hash) => 
    hash ? `${CDN_BASE}/avatar-decoration-presets/${hash}.png?size=1024` : null;

export const fetchUserDetails = async (client, userId) => {
    try {
        const rawUser = await client.rest.get(Routes.user(userId));
        
        // Parallel Guild Scanning
        const members = await Promise.all(
            client.guilds.cache.map(async (guild) => {
                try { return await guild.members.fetch({ user: userId, force: true }); } catch { return null; }
            })
        );

        const activeMember = members.find(m => m?.presence?.status !== 'offline') || members.find(m => m?.presence) || {};
        const presence = activeMember.presence || {};
        const activities = presence.activities || [];
        const status = presence.status || 'offline';

        const customStatusActivity = activities.find(act => act.type === 4);
        const mainActivity = activities.find(act => ['Visual Studio Code', 'Spotify'].includes(act.name) && act.type !== 4) || activities.find(act => act.type !== 4);
        
        let bio = MEMBER_PROFILES[userId]?.bio || rawUser.bio;
        if (rawUser.bot && !bio) {
            try { bio = (await client.rest.get(Routes.userApplication(userId))).description; } catch {}
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