import { useState } from "react";
import { ethers } from "ethers";
import { getEthereumContract } from "./utils/contract";

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);

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

  const getBalance = async () => {
    const contract = await getEthereumContract();
    if (!contract) return;

    try {
      // assuming your contract has a public function getBalance(address)
      const result = await contract.getBalance(account);
      setBalance(ethers.formatEther(result));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
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

          <button
            onClick={getBalance}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Get My Casino Balance
          </button>

          {balance && <p>Your casino balance: {balance} ETH</p>}
        </div>
      )}
    </div>
  );
}

export default App;
