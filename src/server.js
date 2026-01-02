import { file } from 'bun';
import { CONFIG } from './config.js';
import path from 'path';

/**
 * Server Configuration & Constants
 */
const PROJECT_ROOT = path.join(import.meta.dir, "..");

const MIME_TYPES = {
    JSON: "application/json",
    SSE: "text/event-stream"
};

// Base CORS headers required for all API responses
const BASE_CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type"
};

// Pre-computed header objects for different response types
const RESPONSE_HEADERS = {
    JSON: {
        ...BASE_CORS_HEADERS,
        "Content-Type": MIME_TYPES.JSON
    },
    SSE: {
        ...BASE_CORS_HEADERS,
        "Content-Type": MIME_TYPES.SSE,
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    }
};

/**
 * Application State
 * Manages connected SSE clients and the latest broadcasted data.
 */
const connectedClients = new Set();
let currentApplicationState = {};

/**
 * Broadcasts the new state to all connected Server-Sent Events (SSE) clients.
 * If a client connection fails, it is removed from the active pool.
 * 
 * @param {Object} newState - The updated data to send.
 */
export const updateAndBroadcast = (newState) => {
    currentApplicationState = newState;
    const serializedData = `data: ${JSON.stringify(newState)}\n\n`;

    connectedClients.forEach((controller) => {
        try {
            controller.enqueue(serializedData);
        } catch (error) {
            // Client likely disconnected without clean closure
            connectedClients.delete(controller);
        }
    });
};

/**
 * Route Handlers
 */

/**
 * Serves a static file from the project root.
 * @param {string} relativeFilePath - Path relative to project root (e.g., "index.html")
 */
const serveStaticFile = (relativeFilePath) => {
    const absolutePath = path.join(PROJECT_ROOT, relativeFilePath);
    return new Response(file(absolutePath));
};

/**
 * Returns the current application state as JSON.
 */
const handleApiStatus = () => {
    return new Response(JSON.stringify(currentApplicationState), {
        headers: RESPONSE_HEADERS.JSON
    });
};

/**
 * Establishes a Server-Sent Events (SSE) stream.
 * Adds the client to the active pool and sends immediate state if available.
 */
const handleSseStream = () => {
    return new Response(new ReadableStream({
        start(controller) {
            connectedClients.add(controller);
            
            // Send immediate initial state upon connection if available to prevent empty UI
            if (currentApplicationState.lastUpdate) {
                controller.enqueue(`data: ${JSON.stringify(currentApplicationState)}\n\n`);
            }
        },
        cancel(controller) {
            connectedClients.delete(controller);
        }
    }), { headers: RESPONSE_HEADERS.SSE });
};

/**
 * Main Request Router
 * Dispatches requests to specific handlers based on the URL path.
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Response} - The HTTP response
 */
const handleRequest = async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 1. Static Content Routes
    if (pathname === "/" || pathname === "/index.html") {
        return serveStaticFile("index.html");
    }

    if (pathname.startsWith("/public/")) {
        // Remove leading slash to resolve relative to root (e.g. "public/css/style.css")
        return serveStaticFile(pathname.substring(1));
    }

    // 2. API Routes
    if (pathname === "/api/status") {
        return handleApiStatus();
    }

    if (pathname === "/api/stream") {
        return handleSseStream();
    }

    // 3. Fallback
    return new Response("Not Found", { status: 404 });
};

/**
 * Server Initialization
 */
export const startServer = () => {
    Bun.serve({
        port: CONFIG.PORT,
        hostname: "0.0.0.0",
        fetch: handleRequest
    });
    
    console.log(`🚀 [Server] Website running at http://0.0.0.0:${CONFIG.PORT}`);
};