import { ethers } from "ethers";

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      return accounts[0];
    } catch (error) {
      console.error("User rejected wallet connection:", error);
      return null;
    }
  } else {
    alert("MetaMask not detected! Please install it.");
    return null;
  }
};

export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error("MetaMask not found");
};
