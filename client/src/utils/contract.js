import { ethers } from "ethers";
import contractABI from "../abi/ContractABI.json"; // put your ABI JSON path here

// Replace this with the deployed address from Anmol
const contractAddress = "0x1ff2b86a5dB40632DAB47f8A775f91Bc5b40028A";

export const getEthereumContract = async () => {
  if (!window.ethereum) {
    alert("MetaMask not detected!");
    return null;
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  return contract;
};
