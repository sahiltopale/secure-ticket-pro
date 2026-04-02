// blockchainService.ts — Blockchain Integration Layer
// This module provides functions for MetaMask wallet connection,
// NFT minting, and ownership verification.

/**
 * Connect to MetaMask wallet
 * @returns Connected wallet address
 */
export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) {
    alert('MetaMask is not installed. Please install it to use blockchain features.');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

/**
 * Mint a ticket as an NFT (placeholder — requires deployed smart contract)
 * @param contractAddress - The deployed ERC721 contract address
 * @param toAddress - The recipient wallet address
 * @param tokenURI - Metadata URI for the NFT
 * @returns Transaction hash
 */
export async function mintTicketNFT(
  contractAddress: string,
  toAddress: string,
  tokenURI: string
): Promise<string | null> {
  if (!window.ethereum) return null;

  try {
    // ABI for the mint function
    const mintABI = {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'tokenURI', type: 'string' },
      ],
      name: 'mintTicket',
      outputs: [{ name: '', type: 'uint256' }],
      type: 'function',
    };

    // Encode function call (simplified — in production use ethers.js or web3.js)
    console.log('Minting NFT ticket...', { contractAddress, toAddress, tokenURI });
    console.log('Note: Full minting requires a deployed smart contract and ethers.js integration.');

    return null; // Placeholder — return tx hash when contract is deployed
  } catch (error) {
    console.error('Failed to mint NFT:', error);
    return null;
  }
}

/**
 * Verify NFT ownership (placeholder)
 * @param contractAddress - The ERC721 contract address
 * @param tokenId - The NFT token ID
 * @param walletAddress - The wallet to check
 * @returns Whether the wallet owns the token
 */
export async function verifyOwnership(
  contractAddress: string,
  tokenId: number,
  walletAddress: string
): Promise<boolean> {
  console.log('Verifying ownership...', { contractAddress, tokenId, walletAddress });
  console.log('Note: Full verification requires a deployed smart contract.');
  return false; // Placeholder
}

/**
 * Get the current connected wallet address
 */
export async function getCurrentWallet(): Promise<string | null> {
  if (!window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch {
    return null;
  }
}
