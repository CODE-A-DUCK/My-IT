/**
 * @typedef {Object} ProfileData
 * @property {string} bio - Custom biography for the user or bot.
 */

/**
 * Bio overrides for the core team members.
 * Identified by their Discord Snowflake IDs.
 */
const TEAM_MEMBER_PROFILES = {
    // 00
    "872882541336625193": { 
        bio: "" 
    },
    // windows_11_pro
    "798476169703587890": { 
        bio: "Hello,我是Windows11Pro，喜欢python,cpp，同時也是一名硬件發燒友。" 
    },
    // codeaduck
    "830618219646943244": { 
        bio: "你好！我是 Codeaduck，專注於抓取網頁漏洞。目前在HackerOne平台上打工。" 
    },
    // cutebear.py
    "1325245481189773315": { 
        bio: "一個爛爛的python開發者" 
    },
    // Dyeus(.w..w.)
    "771690984844296192": { 
        bio: "不幹正事又在摸魚的某人(其實就在寫bot)" 
    },
    // GH
    "729568770808610917": { 
        bio: "我是 ChinGH，喜歡 js py golang html css java，目前正在用 NodeJs 寫 DC 機器人。" 
    },
    // Hello Phone
    "622373851333918720": { 
        bio: "一個設計網站總能弄出一坨東西的人(QQ)" 
    },
    // Kirano
    "971240439631986790": { 
        bio: "i have no idea..." 
    },
    // fuma_nama
    "572329183334891520": { 
        bio: "A Software Engineer living in Hong Kong, passionated about creation and innovation." 
    },
    // windowsed
    "906415095473655810": { 
        bio: "Hong Kong Developer" 
    },
    // Mantou
    "644504218798915634": { 
        bio: "哈嘍！我叫饅頭，一個java和typescript開發者。" 
    }
};

/**
 * Bio overrides for specialized bots.
 * Identified by their Discord Snowflake IDs.
 */
const BOT_PROFILES = {
    // Empressival
    "942082423846486056": { 
        bio: "Empressival: Valorant 助手，支持商店、通行證、對戰紀錄查詢。" 
    },
    // Junior HiZollo
    "584677291318312963": { 
        bio: "Junior HiZollo: 功能完整的 Discord 機器人，專注於身份組管理。" 
    },
    // GH Bot
    "837564399833055272": { 
        bio: "A Multi Functions Discord Bot" 
    },
    // Ticket Bot
    "955466249482150018": { 
        bio: "Ticket Bot: 支持 Web 控制面板的客服單系統。" 
    }
};

/**
 * Main Export: Combined profile data used by the User Fetcher service.
 * 
 * We combine team and bot profiles into a single lookup table to allow
 * efficient O(1) access by Discord ID.
 * 
 * @type {Object.<string, ProfileData>}
 */
export const PROFILES = {
    ...TEAM_MEMBER_PROFILES,
    ...BOT_PROFILES
};