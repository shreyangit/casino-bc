import { useState } from "react";
import { ethers } from "ethers";

function App() {
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("User rejected the connection:", error);
      }
    } else {
      alert("MetaMask not detected. Please install it.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-4xl font-bold mb-6">🎰 Decentralized Casino</h1>
      
      {account ? (
        <div className="p-4 bg-gray-800 rounded-lg shadow-md">
          <p>Connected Wallet:</p>
          <p className="font-mono text-green-400">{account}</p>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
        >
          Connect MetaMask Wallet
        </button>
      )}
    </div>
  );
}

export default App;
