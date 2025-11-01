import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getEthereumContract } from "./utils/contract";

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(account);
        setWalletBalance(ethers.formatEther(balance));
      } else {
        // Reset balance when disconnected
        setWalletBalance(null);
      }
    };
    fetchBalance();
  }, [account]); // This effect runs whenever the 'account' state changes

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } else {
      alert("Install MetaMask first!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {walletBalance && (
        <div className="absolute top-4 left-4 p-2 bg-gray-800 rounded-lg">
          <p>Wallet Balance: {parseFloat(walletBalance).toFixed(4)} ETH</p>
        </div>
      )}
      <h1 className="text-4xl font-bold mb-4">🎰 Decentralized Casino</h1>

      {!account ? (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p>Connected: {account}</p>
          {balance && <p>Your casino balance: {balance} ETH</p>}
        </div>
      )}
    </div>
  );
}

export default App;
