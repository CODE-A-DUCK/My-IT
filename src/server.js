import { file } from 'bun';
import { CONFIG } from './config.js';
import path from 'path';

const ROOT_DIR = path.join(import.meta.dir, "..");
const clients = new Set();
let cachedStats = {};

export const updateAndBroadcast = (newStats) => {
    cachedStats = newStats;
    const data = JSON.stringify(newStats);
    clients.forEach(c => { try { c.enqueue(`data: ${data}\n\n`); } catch { clients.delete(c); } });
};

export const startServer = () => {
    Bun.serve({
        port: CONFIG.PORT,
        async fetch(req) {
            const url = new URL(req.url);
            const headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            };

            if (url.pathname === "/" || url.pathname === "/index.html") return new Response(file(path.join(ROOT_DIR, "index.html")));
            if (url.pathname.startsWith("/public/")) return new Response(file(path.join(ROOT_DIR, url.pathname.substring(1))));

            if (url.pathname === "/api/status") return new Response(JSON.stringify(cachedStats), { headers: { ...headers, "Content-Type": "application/json" } });

            if (url.pathname === "/api/stream") return new Response(new ReadableStream({
                start: c => (clients.add(c), cachedStats.lastUpdate && c.enqueue(`data: ${JSON.stringify(cachedStats)}\n\n`)),
                cancel: c => clients.delete(c)
            }), { headers: { ...headers, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });

            return new Response("Not Found", { status: 404 });
        }
    });
    console.log(`🚀 [Server] Website running at http://localhost:${CONFIG.PORT}`);
};