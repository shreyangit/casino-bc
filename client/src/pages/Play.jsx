import { useState, useEffect } from "react";

function Play({ peerId, connectedPeers }) {
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    setConnectionCount(connectedPeers.length);
  }, [connectedPeers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          🎮 P2P Game Lobby
        </h1>

        {/* Your Peer ID */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">
            Your Peer ID
          </h2>
          <div className="bg-black/50 p-3 rounded font-mono text-sm text-green-400 break-all">
            {peerId || "Loading..."}
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              🤝 Connected Players
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400 font-bold">{connectionCount}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {connectedPeers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-2">
                  No players connected yet
                </p>
                <p className="text-gray-500 text-xs">
                  Waiting for other players to join...
                </p>
              </div>
            ) : (
              connectedPeers.map((pid) => (
                <div
                  key={pid}
                  className="bg-black/30 p-3 rounded-lg flex items-center gap-3 hover:bg-black/40 transition-colors"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-green-300 font-mono break-all">
                      {pid}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    Online
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Auto-Discovery Enabled</span>
          </h3>
          <div className="space-y-2 text-blue-100 text-sm">
            <p>
              ✨ Players automatically discover and connect to each other through the relay server.
            </p>
            <p>
              🔄 New players joining will appear here automatically - no manual connection needed!
            </p>
            <p>
              🧪 Open multiple browser tabs or share this link to test peer discovery.
            </p>
          </div>
        </div>

        {/* Debug Info */}
        {connectionCount > 0 && (
          <div className="mt-6 bg-green-500/10 border border-green-400/30 rounded-lg p-4">
            <p className="text-green-300 text-sm text-center">
              🎉 Successfully connected to {connectionCount} peer{connectionCount !== 1 ? 's' : ''}! Ready to play.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Play;