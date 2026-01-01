//act

const $ = s => document.querySelector(s);
const esc = s => (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const actTpl = (a) => `
<div class="member-activity">
    <span class="activity-type">${['Playing', 'Streaming', 'Listening', 'Watching', 'Custom', 'Competing'][a.type] || 'Activity'}</span>
    <span class="activity-name">${a.name}</span>
    ${a.details ? `<span class="activity-details">${a.details}</span>` : ''}
</div>`;

const teamTpl = m => `
<div class="card member-card profile-card">
    <div class="profile-banner" style="${m.banner_url ? `background-image:url('${m.banner_url}')` : `background-color:${m.accent_color || 'var(--card-border)'}`}"></div>
    <div class="profile-content">
        <div class="avatar-wrapper">
            <img src="${m.avatar_url}" class="member-avatar" alt="${m.username}">
            ${m.decoration_url ? `<img src="${m.decoration_url}" class="avatar-decoration">` : ''}
            <div class="status-dot status-${m.status || 'offline'}"></div>
        </div>
        <div class="member-info">
            <div class="member-names">
                <span class="global-name">${esc(m.global_name || m.username)}</span>
                <span class="username">@${esc(m.username)}</span>
            </div>
            <p class="member-bio">${esc(m.bio)}</p>
            ${m.status_text ? `<div class="custom-status-box">"${esc(m.status_text)}"</div>` : ''}
            ${m.activities?.[0] ? actTpl(m.activities[0]) : ''}
        </div>
    </div>
</div>`;

const botTpl = b => `
<div class="card product-card">
    <div class="product-icon"><img src="${b.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="${esc(b.username)}"></div>
    <h3 class="product-name">${esc(b.username)}</h3>
    <p class="product-desc">${esc(b.bio)}</p>
</div>`;

const render = d => {
    d.team?.length && ($('.team-grid').innerHTML = d.team.map(teamTpl).join(''));
    d.bots?.length && ($('#bots-grid').innerHTML = d.bots.map(botTpl).join(''));
};

const init = () => {
    const es = new EventSource('http://localhost:8080/api/stream');
    es.onmessage = e => render(JSON.parse(e.data));
    es.onerror = () => (es.close(), setTimeout(init, 3000));
};

init();