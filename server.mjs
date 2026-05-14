import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { extname, join, normalize, resolve } from "node:path";

const root = process.cwd();
const preferredPort = Number(process.env.PORT || 4173);
const rooms = new Map();
const STREAM_HEARTBEAT_MS = 15000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    await handleApiRequest(request, response, url);
    return;
  }

  const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(join(root, safePath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, "index.html");
  }

  response.writeHead(200, {
    "Content-Type": types[extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}

async function handleApiRequest(request, response, url) {
  try {
    if (request.method === "POST" && url.pathname === "/api/rooms") {
      const room = createRoom();
      sendJson(response, 200, { roomId: room.id });
      return;
    }

    const roomMatch = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{4,8})(?:\/(join|events|stream))?$/);
    if (!roomMatch) {
      sendJson(response, 404, { error: "Unknown endpoint" });
      return;
    }

    const roomId = roomMatch[1];
    const action = roomMatch[2];
    const room = getOrCreateRoom(roomId);

    if (request.method === "GET" && action === "stream") {
      const clientId = sanitizeClientId(url.searchParams.get("clientId") || "");
      const since = Math.max(
        Number(url.searchParams.get("since") || 0),
        Number(request.headers["last-event-id"] || 0)
      );
      openEventStream(request, response, room, clientId, since);
      return;
    }

    if (request.method === "POST" && action === "join") {
      const body = await readJson(request);
      const clientId = sanitizeClientId(body.clientId);
      const role = assignRole(room, clientId);
      addEvent(room, clientId, "presence", { role });
      sendJson(response, 200, { roomId, role, lastEventId: room.nextEventId - 1 });
      return;
    }

    if (request.method === "POST" && action === "events") {
      const body = await readJson(request);
      const clientId = sanitizeClientId(body.clientId);
      const role = assignRole(room, clientId);
      const event = addEvent(room, clientId, String(body.type || "message"), body.payload ?? {}, role);
      sendJson(response, 200, { ok: true, id: event.id });
      return;
    }

    if (request.method === "GET" && action === "events") {
      const since = Number(url.searchParams.get("since") || 0);
      const clientId = sanitizeClientId(url.searchParams.get("clientId") || "");
      const events = room.events.filter((event) => event.id > since && event.clientId !== clientId);
      sendJson(response, 200, { events, latestEventId: room.nextEventId - 1 });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
}

function createRoom() {
  let id = "";
  do {
    id = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (rooms.has(id));

  const room = getOrCreateRoom(id);
  return room;
}

function getOrCreateRoom(id) {
  const roomId = id.toUpperCase();
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      hostId: null,
      guestId: null,
      events: [],
      streams: new Set(),
      nextEventId: 1,
      updatedAt: Date.now()
    });
  }

  return rooms.get(roomId);
}

function assignRole(room, clientId) {
  room.updatedAt = Date.now();
  if (!room.hostId || room.hostId === clientId) {
    room.hostId = clientId;
    return "host";
  }

  if (!room.guestId || room.guestId === clientId) {
    room.guestId = clientId;
    return "guest";
  }

  return "spectator";
}

function addEvent(room, clientId, type, payload, role = null) {
  const event = {
    id: room.nextEventId,
    clientId,
    role,
    type,
    payload,
    at: Date.now()
  };
  room.nextEventId += 1;
  room.events.push(event);
  room.events = room.events.slice(-500);
  room.updatedAt = Date.now();
  broadcastEvent(room, event);
  return event;
}

function openEventStream(request, response, room, clientId, since) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  response.write(`retry: 1200\n`);
  response.write(`: connected ${Date.now()}\n\n`);

  const stream = {
    clientId,
    response,
    heartbeat: setInterval(() => {
      response.write(`: ping ${Date.now()}\n\n`);
    }, STREAM_HEARTBEAT_MS)
  };
  room.streams.add(stream);

  for (const event of room.events.filter((candidate) => candidate.id > since && candidate.clientId !== clientId)) {
    writeStreamEvent(stream, event);
  }

  request.on("close", () => {
    clearInterval(stream.heartbeat);
    room.streams.delete(stream);
  });
}

function broadcastEvent(room, event) {
  for (const stream of room.streams) {
    if (stream.clientId === event.clientId) {
      continue;
    }
    writeStreamEvent(stream, event);
  }
}

function writeStreamEvent(stream, event) {
  stream.response.write(`id: ${event.id}\n`);
  stream.response.write(`event: room-event\n`);
  stream.response.write(`data: ${JSON.stringify(event)}\n\n`);
}

function sanitizeClientId(value) {
  return String(value || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "anonymous";
}

function readJson(request) {
  return new Promise((resolveJson, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolveJson(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function listen(port) {
  const server = createServer(handleRequest);

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }

    throw error;
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Chess Wars running at http://127.0.0.1:${port}`);
    for (const address of getLanAddresses()) {
      console.log(`LAN link: http://${address}:${port}`);
    }
  });
}

function getLanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address);
}

listen(preferredPort);
