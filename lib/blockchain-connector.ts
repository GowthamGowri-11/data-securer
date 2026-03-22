/**
 * Real Blockchain Connector Module
 * 
 * Connects to deployed DataIntegrity smart contract on Ethereum testnet
 * Uses ethers.js for blockchain interaction
 * 
 * SERVER-ONLY MODULE - Do not import in client components
 */

import 'server-only';
import { ethers } from 'ethers';

/**
 * Blockchain Proof Structure
 */
export interface BlockchainProof {
  hash: string;
  encryptedData: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  storedAt: Date;
}

/**
 * Smart Contract ABI (Application Binary Interface)
 * Defines the contract's functions and events
 */
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_hash", "type": "string" },
      { "internalType": "string", "name": "_encryptedData", "type": "string" },
      { "internalType": "uint256", "name": "_timestamp", "type": "uint256" }
    ],
    "name": "storeData",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "getData",
    "outputs": [
      { "internalType": "string", "name": "hash", "type": "string" },
      { "internalType": "string", "name": "encryptedData", "type": "string" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDataCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "hash", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "DataStored",
    "type": "event"
  }
];

/**
 * Blockchain Connection Manager
 */
class BlockchainConnector {
  private provider: ethers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;
  private hashToIdMap: Map<string, number> = new Map();
  private proofCache: Map<string, BlockchainProof> = new Map();

  private isInitializing: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize blockchain connection
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
        const contractAddress = process.env.CONTRACT_ADDRESS;
        const privateKey = process.env.PRIVATE_KEY;

        if (!rpcUrl || !contractAddress || !privateKey) {
          console.warn('[Blockchain] Missing environment variables for blockchain. Using mock/null provider.');
          return;
        }

        // Connect to blockchain network (non-blocking)
        this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
          staticNetwork: true // Speed up initialization by skipping network detection
        });
        
        // Create wallet instance
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        // Connect to smart contract
        this.contract = new ethers.Contract(contractAddress, CONTRACT_ABI, this.wallet);

        console.log('[Blockchain] ✓ Connected to network');
      } catch (error) {
        console.error('[Blockchain] ✗ Initialization failed:', error);
        this.initializationPromise = null; // Allow retry
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Ensure connection is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.contract || !this.provider || !this.wallet) {
      await this.initialize();
    }
  }

  /**
   * Store data proof on blockchain
   */
  async storeProof(
    hash: string,
    encryptedData: string,
    timestamp: number
  ): Promise<BlockchainProof> {
    await this.ensureInitialized();

    try {
      console.log('[Blockchain] Storing proof on-chain...');

      // Call smart contract function
      const tx = await this.contract!.storeData(hash, encryptedData, timestamp);
      
      console.log('[Blockchain] Transaction sent:', tx.hash);
      console.log('[Blockchain] Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log('[Blockchain] ✓ Transaction confirmed in block:', receipt.blockNumber);

      // Parse event to get the ID
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract!.interface.parseLog(log);
          return parsed?.name === 'DataStored';
        } catch {
          return false;
        }
      });

      let recordId = 0;
      if (event) {
        const parsed = this.contract!.interface.parseLog(event);
        recordId = Number(parsed?.args[0]);
      }

      // Store mapping for retrieval
      this.hashToIdMap.set(hash, recordId);

      const proof: BlockchainProof = {
        hash,
        encryptedData,
        timestamp,
        blockNumber: receipt.blockNumber,
        transactionHash: receipt.hash,
        storedAt: new Date(),
      };

      return proof;
    } catch (error) {
      console.error('[Blockchain] ✗ Storage failed:', error);
      throw new Error(`Blockchain storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve proof from blockchain by hash
   */
  async getProof(hash: string): Promise<BlockchainProof | null> {
    await this.ensureInitialized();

    try {
      // Check proof cache first
      if (this.proofCache.has(hash)) {
        console.log('[Blockchain] ✓ Proof retrieved from local cache');
        return this.proofCache.get(hash)!;
      }

      console.log('[Blockchain] Retrieving proof from chain...');

      // Get record ID from mapping
      let recordId = this.hashToIdMap.get(hash);

      // If not in map, search through all records (slower but works)
      if (recordId === undefined) {
        const count = await this.contract!.getDataCount();
        const totalCount = Number(count);

        console.log(`[Blockchain] Searching ${totalCount} records for hash...`);

        // Search backwards as new records are more likely to be verified
        for (let i = totalCount - 1; i >= 0; i--) {
          const data = await this.contract!.getData(i);
          if (data[0] === hash) {
            recordId = i;
            this.hashToIdMap.set(hash, i);
            break;
          }
        }
      }

      if (recordId === undefined) {
        console.log('[Blockchain] ✗ Proof not found');
        return null;
      }

      // Retrieve data from contract
      const data = await this.contract!.getData(recordId);

      const proof: BlockchainProof = {
        hash: data[0],
        encryptedData: data[1],
        timestamp: Number(data[2]),
        blockNumber: 0, // Not stored in contract
        transactionHash: '', // Not stored in contract
        storedAt: new Date(Number(data[2]) * 1000), // Convert to ms if needed (usually unix ts is seconds)
      };

      // Store in cache
      this.proofCache.set(hash, proof);

      console.log('[Blockchain] ✓ Proof retrieved successfully');
      return proof;
    }
 catch (error) {
      console.error('[Blockchain] ✗ Retrieval failed:', error);
      throw new Error(`Blockchain retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get total number of records on blockchain
   */
  async getRecordCount(): Promise<number> {
    await this.ensureInitialized();
    const count = await this.contract!.getDataCount();
    return Number(count);
  }

  /**
   * Get blockchain statistics
   */
  async getStats() {
    await this.ensureInitialized();
    
    const count = await this.getRecordCount();
    const network = await this.provider!.getNetwork();
    const balance = await this.provider!.getBalance(this.wallet!.address);

    return {
      network: network.name,
      chainId: Number(network.chainId),
      contractAddress: await this.contract!.getAddress(),
      walletAddress: this.wallet!.address,
      walletBalance: ethers.formatEther(balance),
      totalRecords: count,
    };
  }
}

// Singleton instance
const blockchainConnector = new BlockchainConnector();

/**
 * Store data proof on blockchain
 */
export async function storeDataOnBlockchain(
  hash: string,
  encryptedData: string,
  timestamp: number
): Promise<string> {
  try {
    console.log('[Blockchain] Storing proof...');
    const proof = await blockchainConnector.storeProof(hash, encryptedData, timestamp);
    console.log('[Blockchain] ✓ Proof stored successfully');
    return proof.transactionHash;
  } catch (error) {
    console.error('[Blockchain] ✗ Storage failed:', error);
    throw new Error(`Failed to store on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieve data proof from blockchain
 */
export async function getDataFromBlockchain(hash: string): Promise<BlockchainProof | null> {
  try {
    console.log('[Blockchain] Retrieving proof...');
    const proof = await blockchainConnector.getProof(hash);
    
    if (proof) {
      console.log('[Blockchain] ✓ Proof retrieved successfully');
    } else {
      console.log('[Blockchain] ✗ Proof not found');
    }
    
    return proof;
  } catch (error) {
    console.error('[Blockchain] ✗ Retrieval failed:', error);
    throw new Error(`Failed to retrieve from blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Initialize blockchain connection
 */
export async function initializeBlockchain(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[Blockchain] Initializing connection...');
    await blockchainConnector.initialize();
    
    const stats = await blockchainConnector.getStats();
    
    console.log('[Blockchain] ✓ Connected successfully');
    console.log(`[Blockchain] Network: ${stats.network} (Chain ID: ${stats.chainId})`);
    console.log(`[Blockchain] Contract: ${stats.contractAddress}`);
    console.log(`[Blockchain] Records: ${stats.totalRecords}`);
    
    return {
      success: true,
      message: `Connected to ${stats.network}. ${stats.totalRecords} records on-chain.`,
    };
  } catch (error) {
    console.error('[Blockchain] ✗ Initialization failed:', error);
    return {
      success: false,
      message: `Blockchain initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get blockchain statistics
 */
export async function getBlockchainStats() {
  return blockchainConnector.getStats();
}

/**
 * Verify if a proof exists on blockchain
 */
export async function proofExists(hash: string): Promise<boolean> {
  try {
    const proof = await blockchainConnector.getProof(hash);
    return proof !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get all proofs (not implemented for real blockchain - would be expensive)
 */
export async function getAllBlockchainProofs(): Promise<BlockchainProof[]> {
  throw new Error('getAllBlockchainProofs not implemented for real blockchain - use indexing service instead');
}

/**
 * Clear blockchain storage (not possible on real blockchain)
 */
export function clearBlockchainStorage(): void {
  throw new Error('Cannot clear blockchain storage - blockchain is immutable');
}
