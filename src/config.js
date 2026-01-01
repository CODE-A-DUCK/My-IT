export const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    PORT: process.env.PORT || 8080,
    GUILD_ID: process.env.GUILD_ID,
    TARGET_USER_IDS: [
        "872882541336625193", // (00)
        "798476169703587890", // (windows_11_pro)
        "830618219646943244", // (codeaduck)
        "755861933961511074", // (cutebear.py)
        "771690984844296192", // (Dyeus(.w..w.)
        "729568770808610917", // (GH)
        "622373851333918720", // (Hello Phone)
        "971240439631986790", // (Kirano)
        "572329183334891520", // (fuma_nama)
        "906415095473655810",  // (windowsed)
        "644504218798915634"  // (Mantou)
    ],
    TARGET_BOT_IDS: [
        "942082423846486056", // (Empressival)
        "584677291318312963", // (Junior HiZollo)
        "837564399833055272", // (GH Bot)
        "955466249482150018"  // (Ticket Bot)
    ]
};

if (!CONFIG.TOKEN) {
    console.warn("⚠️ [Config] Warning: DISCORD_TOKEN is missing. Bot features will not work, but the web server will start.");
}
