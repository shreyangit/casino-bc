import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";

const RELAY_PORT = 9090;
const PROTOCOL = "/game-discovery/1.0.0";

async function startRelay() {
  try {
    console.log("🚀 Starting relay server...");

    const relayNode = await createLibp2p({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${RELAY_PORT}/ws`],
      },
      transports: [webSockets(), tcp()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        identify: identify(),
        relay: circuitRelayServer({
          advertise: {
            bootDelay: 15 * 1000,
          },
          reservations: {
            maxReservations: 100,
          },
        }),
      },
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ Relay Server Started Successfully!");
    console.log("=".repeat(60));
    console.log("\n📋 Server Information:");
    console.log(`  Peer ID: ${relayNode.peerId.toString()}`);
    console.log(`  Port: ${RELAY_PORT}`);
    console.log("\n📡 Listening Addresses:");
    relayNode.getMultiaddrs().forEach((addr) => {
      console.log(`  ${addr.toString()}`);
    });
    console.log("\n🔗 Client Connection String:");
    console.log(
      `  /ip4/10.81.105.241/tcp/${RELAY_PORT}/ws/p2p/${relayNode.peerId.toString()}`
    );
    console.log("\n" + "=".repeat(60) + "\n");

    // Handle discovery protocol - forward messages to all connected peers
    await relayNode.handle(PROTOCOL, async ({ stream, connection }) => {
      const fromPeer = connection.remotePeer.toString();
      console.log(`📨 Discovery message from ${fromPeer.slice(0, 12)}...`);

      try {
        // Read the incoming announcement
        const chunks = [];
        for await (const chunk of stream.source) {
          chunks.push(chunk);
        }
        
        const announcement = Buffer.concat(chunks);
        await stream.close();

        console.log(`📢 Broadcasting to other peers...`);

        // Forward to all other connected peers
        const connections = relayNode.getConnections();
        let broadcastCount = 0;

        for (const conn of connections) {
          const targetPeer = conn.remotePeer.toString();

          // Don't send back to the sender
          if (targetPeer === fromPeer) continue;

          try {
            const outStream = await conn.newStream(PROTOCOL);
            const writer = outStream.writable.getWriter();
            await writer.write(announcement);
            await writer.close();
            broadcastCount++;
          } catch (err) {
            console.log(`⚠️ Failed to forward to ${targetPeer.slice(0, 12)}...: ${err.message}`);
          }
        }

        console.log(`✅ Broadcasted to ${broadcastCount} peer(s)\n`);
      } catch (err) {
        console.error("❌ Error handling discovery:", err);
      }
    });

    console.log("📡 Discovery protocol handler registered\n");

    // Event listeners for connection monitoring
    relayNode.addEventListener("peer:connect", (evt) => {
      console.log(`🤝 Peer connected: ${evt.detail.toString()}`);
    });

    relayNode.addEventListener("peer:disconnect", (evt) => {
      console.log(`👋 Peer disconnected: ${evt.detail.toString()}`);
    });

    // Graceful shutdown handler
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down relay server...");
      await relayNode.stop();
      console.log("✅ Relay server stopped");
      process.exit(0);
    });

    return relayNode;
  } catch (err) {
    console.error("❌ Failed to start relay server:", err);
    console.error("\nStack trace:", err.stack);
    process.exit(1);
  }
}

// Start the relay server
console.log("🔧 Initializing relay server...");
startRelay().then(() => {
  console.log("✨ Relay is ready to accept connections\n");
});