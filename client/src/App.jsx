import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Play from "./pages/Play";
import Profile from "./pages/Profile";
import { connectWallet } from "./utils/wallet";
import { createNode } from "./p2p";

function App() {
  const [account, setAccount] = useState(null);
  const [nodeReady, setNodeReady] = useState(false);
  const [peerId, setPeerId] = useState("");
  const [connectedPeers, setConnectedPeers] = useState([]);
  const nodeRef = useRef(null);

  const handleConnect = async () => {
    const acc = await connectWallet();
    if (acc) setAccount(acc);
  };

  useEffect(() => {
    let mounted = true;
    let updateInterval = null;

    const initNode = async () => {
      try {
        const node = await createNode();
        
        if (!mounted) {
          await node.stop();
          return;
        }

        nodeRef.current = node;
        const myPeerId = node.peerId.toString();
        setPeerId(myPeerId);
        setNodeReady(true);

        const RELAY_PEER_ID = "12D3KooWDmYQoYxutu7b1TK69rs5kiTESN1VTuHYqYzkxTimrpPB";

        // Update connected peers list
        const updateConnections = () => {
          if (!nodeRef.current || !mounted) return;

          const connections = nodeRef.current.getConnections();
          const peerIds = connections
            .map((conn) => conn.remotePeer.toString())
            .filter((pid) => pid !== myPeerId && pid !== RELAY_PEER_ID);

          const uniquePeers = [...new Set(peerIds)];
          setConnectedPeers(uniquePeers);
        };

        // Handle peer connection events
        const handlePeerConnect = (evt) => {
          const remotePeerId = evt.detail.toString();
          if (remotePeerId !== RELAY_PEER_ID) {
            console.log("✅ Connected to peer:", remotePeerId);
            updateConnections();
          }
        };

        const handlePeerDisconnect = (evt) => {
          const remotePeerId = evt.detail.toString();
          if (remotePeerId !== RELAY_PEER_ID) {
            console.log("👋 Disconnected from peer:", remotePeerId);
            updateConnections();
          }
        };

        node.addEventListener("peer:connect", handlePeerConnect);
        node.addEventListener("peer:disconnect", handlePeerDisconnect);

        // Initial update
        updateConnections();

        // Periodic update every 2 seconds
        updateInterval = setInterval(updateConnections, 2000);

      } catch (err) {
        console.error("❌ Failed to initialize Libp2p node:", err);
      }
    };

    initNode();

    // Cleanup function
    return () => {
      mounted = false;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (nodeRef.current) {
        nodeRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        <Navbar account={account} onConnect={handleConnect} />
        
        {!nodeReady ? (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400 text-xl">Initializing P2P Node...</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/play"
                element={
                  <Play 
                    peerId={peerId} 
                    connectedPeers={connectedPeers}
                  />
                }
              />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;