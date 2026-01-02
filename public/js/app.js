/**
 * Application Constants
 */
const CONFIG = {
    SELECTORS: {
        TEAM_GRID: '.team-grid',
        BOTS_GRID: '#bots-grid',
    },
    ENDPOINTS: {
        STREAM: '/api/stream',
    },
    RECONNECT_DELAY_MS: 3000,
    DEFAULT_AVATAR: 'https://cdn.discordapp.com/embed/avatars/0.png',
    ACTIVITY_TYPES: [
        'Playing',
        'Streaming',
        'Listening',
        'Watching',
        'Custom',
        'Competing'
    ]
};

/**
 * Utility Functions
 */

/**
 * Selects a DOM element.
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null}
 */
const getElement = (selector) => document.querySelector(selector);

/**
 * Escapes HTML characters to prevent XSS.
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
const escapeHtml = (str) => {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * HTML Generators
 */

/**
 * Generates HTML for a user's current activity.
 * @param {Object} activity - Activity data object
 * @returns {string} HTML string
 */
const createActivityHtml = (activity) => {
    const typeLabel = CONFIG.ACTIVITY_TYPES[activity.type] || 'Activity';
    const detailsHtml = activity.details 
        ? `<span class="activity-details">${activity.details}</span>` 
        : '';

    return `
        <div class="member-activity">
            <span class="activity-type">${typeLabel}</span>
            <span class="activity-name">${activity.name}</span>
            ${detailsHtml}
        </div>
    `;
};

/**
 * Generates the style string for a profile banner.
 * @param {string|null} bannerUrl - URL of the banner image
 * @param {string|null} accentColor - Hex color code
 * @returns {string} CSS style string
 */
const getBannerStyle = (bannerUrl, accentColor) => {
    if (bannerUrl) {
        return `background-image:url('${bannerUrl}')`;
    }
    return `background-color:${accentColor || 'var(--card-border)'}`;
};

/**
 * Generates HTML for a team member card.
 * @param {Object} member - Member data object
 * @returns {string} HTML string
 */
const createMemberCardHtml = (member) => {
    const bannerStyle = getBannerStyle(member.banner_url, member.accent_color);
    const globalName = escapeHtml(member.global_name || member.username);
    const username = escapeHtml(member.username);
    const bio = escapeHtml(member.bio);
    const status = member.status || 'offline';
    
    // Decoration HTML
    const decorationHtml = member.decoration_url 
        ? `<img src="${member.decoration_url}" class="avatar-decoration">` 
        : '';

    // Status Text HTML
    const statusTextHtml = member.status_text 
        ? `<div class="custom-status-box">"${escapeHtml(member.status_text)}"</div>` 
        : '';

    // Activity HTML (first activity only)
    const primaryActivity = member.activities && member.activities[0];
    const activityHtml = primaryActivity ? createActivityHtml(primaryActivity) : '';

    return `
        <div class="card member-card profile-card">
            <div class="profile-banner" style="${bannerStyle}"></div>
            <div class="profile-content">
                <div class="avatar-wrapper">
                    <img src="${member.avatar_url}" class="member-avatar" alt="${username}">
                    ${decorationHtml}
                    <div class="status-dot status-${status}"></div>
                </div>
                <div class="member-info">
                    <div class="member-names">
                        <span class="global-name">${globalName}</span>
                        <span class="username">@${username}</span>
                    </div>
                    <p class="member-bio">${bio}</p>
                    ${statusTextHtml}
                    ${activityHtml}
                </div>
            </div>
        </div>
    `;
};

/**
 * Generates HTML for a bot card.
 * @param {Object} bot - Bot data object
 * @returns {string} HTML string
 */
const createBotCardHtml = (bot) => {
    const avatarUrl = bot.avatar_url || CONFIG.DEFAULT_AVATAR;
    const username = escapeHtml(bot.username);
    const description = escapeHtml(bot.bio);

    return `
        <div class="card product-card">
            <div class="product-icon">
                <img src="${avatarUrl}" alt="${username}">
            </div>
            <h3 class="product-name">${username}</h3>
            <p class="product-desc">${description}</p>
        </div>
    `;
};

/**
 * Core Application Logic
 */

/**
 * Renders the dashboard with the provided data.
 * @param {Object} data - API response data
 * @param {Array} [data.team] - List of team members
 * @param {Array} [data.bots] - List of bots
 */
const renderDashboard = (data) => {
    // Update Team Grid
    if (data.team && data.team.length > 0) {
        const teamGrid = getElement(CONFIG.SELECTORS.TEAM_GRID);
        if (teamGrid) {
            teamGrid.innerHTML = data.team.map(createMemberCardHtml).join('');
        }
    }

    // Update Bots Grid
    if (data.bots && data.bots.length > 0) {
        const botsGrid = getElement(CONFIG.SELECTORS.BOTS_GRID);
        if (botsGrid) {
            botsGrid.innerHTML = data.bots.map(createBotCardHtml).join('');
        }
    }
};

/**
 * Initializes the Server-Sent Events stream.
 */
const initializeStream = () => {
    const eventSource = new EventSource(CONFIG.ENDPOINTS.STREAM);

    eventSource.onmessage = (event) => {
        try {
            const parsedData = JSON.parse(event.data);
            renderDashboard(parsedData);
        } catch (error) {
            console.error('Failed to parse stream data:', error);
        }
    };

    eventSource.onerror = () => {
        eventSource.close();
        setTimeout(initializeStream, CONFIG.RECONNECT_DELAY_MS);
    };
};

// Start application
initializeStream();