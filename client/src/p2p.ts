import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { webRTC } from "@libp2p/webrtc";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { bootstrap } from "@libp2p/bootstrap";
import { multiaddr } from "@multiformats/multiaddr";

const PROTOCOL = "/game-discovery/1.0.0";

// CHANGE THIS: Update with your actual relay server Peer ID after starting relay.js
// Get this from the relay server console output
// CHANGE THIS: Update with your actual relay server Peer ID after starting relay.js
// Get this from the relay server console output
const RELAY_PEER_ID = "12D3KooWDmYQoYxutu7b1TK69rs5kiTESN1VTuHYqYzkxTimrpPB";

// CHANGE THIS: Use localhost if testing on same machine, or your network IP
const RELAY_IP = "10.254.212.190"; // or "localhost" or "10.81.105.241"
const RELAY_PORT = 9090;

const RELAY_ADDR = `/ip4/${RELAY_IP}/tcp/${RELAY_PORT}/ws/p2p/${RELAY_PEER_ID}`;

export async function createNode() {
  try {
    console.log("🚀 Creating P2P node...");
    console.log("📡 Relay address:", RELAY_ADDR);
    
    const node = await createLibp2p({
      addresses: {
        listen: ['/webrtc', '/p2p-circuit'],
      },
      transports: [
        webSockets({
          filter: {
            denyDialMultiaddr: () => false
          }
        }),
        webRTC(),
        circuitRelayTransport({
          discoverRelays: 1,
        }),
      ],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      connectionGater: {
        denyDialMultiaddr: async () => false,
      },
      peerDiscovery: [
        bootstrap({
          list: [RELAY_ADDR],
        }),
      ],
      services: {
        identify: identify(),
      },
    });

    const myPeerId = node.peerId.toString();
    console.log("✅ Node started:", myPeerId);

    const discoveredPeers = new Set<string>();

    // Handle incoming discovery messages from relay
    await node.handle(PROTOCOL, async ({ stream, connection }) => {
      try {
        const remotePeerId = connection.remotePeer.toString();
        
        // Ignore relay and self
        if (remotePeerId === RELAY_PEER_ID || remotePeerId === myPeerId) {
          await stream.close();
          return;
        }

        console.log("📨 Received discovery from:", remotePeerId.slice(0, 12) + "...");

        // Read the announcement data
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream.source) {
          chunks.push(chunk.subarray());
        }
        
        const decoder = new TextDecoder();
        const data = decoder.decode(Buffer.concat(chunks));
        console.log("📩 Discovery data:", data);

        await stream.close();

        // Check if already discovered
        if (discoveredPeers.has(remotePeerId)) {
          console.log("⏭️ Already discovered this peer");
          return;
        }

        discoveredPeers.add(remotePeerId);

        // Try to establish direct P2P connection via relay circuit
        console.log("🔗 Attempting P2P connection via relay...");
        try {
          const relayCircuitAddr = multiaddr(
            `${RELAY_ADDR}/p2p-circuit/p2p/${remotePeerId}`
          );
          await node.dial(relayCircuitAddr);
          console.log("✅ Connected to peer:", remotePeerId.slice(0, 12) + "...");
        } catch (err: any) {
          console.warn("⚠️ P2P connection failed:", err.message);
        }
      } catch (err) {
        console.error("❌ Error handling discovery:", err);
      }
    });

    // Wait for relay connection with multiple attempts
    console.log("⏳ Connecting to relay...");
    
    let relayConnected = false;
    const maxAttempts = 10;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const connections = node.getConnections();
      console.log(`🔍 Attempt ${attempt}/${maxAttempts}: ${connections.length} connection(s)`);
      
      // Log all connections for debugging
      connections.forEach(conn => {
        console.log(`   - Connected to: ${conn.remotePeer.toString().slice(0, 12)}...`);
      });
      
      relayConnected = connections.some(
        c => c.remotePeer.toString() === RELAY_PEER_ID
      );
      
      if (relayConnected) {
        console.log("✅ Connected to relay!");
        break;
      }
      
      // Try manual dial if bootstrap hasn't connected yet
      if (attempt === 3 || attempt === 6) {
        console.log("🔄 Attempting manual dial to relay...");
        try {
          const ma = multiaddr(RELAY_ADDR);
          console.log("   Dialing:", ma.toString());
          await node.dial(ma);
          console.log("   Dial successful!");
        } catch (err: any) {
          console.warn("⚠️ Manual dial failed:", err.message);
        }
      }
    }

    if (!relayConnected) {
      console.error("❌ Failed to connect to relay after", maxAttempts, "attempts");
      console.error("\n📋 Troubleshooting steps:");
      console.error("   1. Make sure relay server is running: node relay.js");
      console.error("   2. Check relay output for the correct Peer ID");
      console.error("   3. Update RELAY_PEER_ID in this file with the correct ID");
      console.error("   4. If testing locally, use RELAY_IP = '127.0.0.1'");
      console.error("   5. If on network, use your machine's local IP (check ipconfig/ifconfig)");
      console.error("\n💡 Current config:");
      console.error("   RELAY_ADDR:", RELAY_ADDR);
      return node;
    }

    // Announce presence to relay
    const announceToRelay = async () => {
      try {
        const relayConn = node.getConnections().find(
          c => c.remotePeer.toString() === RELAY_PEER_ID
        );

        if (!relayConn) {
          console.log("⚠️ Not connected to relay, skipping announcement");
          return;
        }

        const stream = await relayConn.newStream(PROTOCOL);
        
        const announcement = JSON.stringify({
          peerId: myPeerId,
          timestamp: Date.now(),
        });

        // Send announcement data using async generator for the sink
        const encoder = new TextEncoder();
        const data = encoder.encode(announcement);
        
        // Create an async iterable source
        const source = [data];
        
        // Pipe data to the stream sink
        await stream.sink(source);
        await stream.close();

        console.log("📢 Announced to relay");
      } catch (err: any) {
        console.error("❌ Announcement failed:", err.message);
        console.error("   Full error:", err);
      }
    };

    // Initial announcement after connection
    console.log("⏳ Waiting before first announcement...");
    setTimeout(announceToRelay, 2000);

    // Periodic announcements every 8 seconds
    setInterval(announceToRelay, 8000);

    // Listen to connection events
    node.addEventListener("peer:connect", (evt) => {
      const peerId = evt.detail.toString();
      if (peerId !== RELAY_PEER_ID) {
        console.log("🤝 Peer connected:", peerId.slice(0, 12) + "...");
      } else {
        console.log("🔗 Relay connection established");
      }
    });

    node.addEventListener("peer:disconnect", (evt) => {
      const peerId = evt.detail.toString();
      if (peerId !== RELAY_PEER_ID) {
        console.log("👋 Peer disconnected:", peerId.slice(0, 12) + "...");
        discoveredPeers.delete(peerId);
      } else {
        console.log("⚠️ Relay connection lost");
      }
    });

    return node;
  } catch (err) {
    console.error("❌ Failed to create node:", err);
    throw err;
  }
}