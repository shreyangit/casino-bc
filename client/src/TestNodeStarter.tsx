// src/TestNodeStarter.tsx
import React, { useEffect, useState } from "react";
import { createNode } from "./p2p";

export default function TestNodeStarter() {
  const [peerId, setPeerId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const node = await createNode();
        if (mounted) setPeerId(node.peerId?.toString() ?? null);
      } catch (err) {
        console.error("Failed to create libp2p node:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4">
      <h3>libp2p Node Test</h3>
      <p>peerId: {peerId ?? "starting..."}</p>
    </div>
  );
}
