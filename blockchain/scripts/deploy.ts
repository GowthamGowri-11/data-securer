import { ethers } from 'hardhat';

async function main() {
  console.log('========================================');
  console.log('Deploying DataIntegrity Contract');
  console.log('========================================\n');

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log('Network:', network.name);
  console.log('Chain ID:', network.chainId.toString());

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying from account:', deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH\n');

  // Deploy contract
  console.log('Deploying DataIntegrity contract...');
  const DataIntegrity = await ethers.getContractFactory('DataIntegrity');
  const contract = await DataIntegrity.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  
  console.log('\n========================================');
  console.log('✅ Deployment Successful!');
  console.log('========================================');
  console.log('Contract Address:', address);
  console.log('\n📝 IMPORTANT: Update your .env file with:');
  console.log(`CONTRACT_ADDRESS="${address}"`);
  console.log(`BLOCKCHAIN_NETWORK="${network.name}"`);
  console.log('\n🔍 View on Block Explorer:');
  
  // Provide block explorer links based on network
  if (network.chainId === 11155111n) {
    console.log(`https://sepolia.etherscan.io/address/${address}`);
  } else if (network.chainId === 80001n) {
    console.log(`https://mumbai.polygonscan.com/address/${address}`);
  } else if (network.chainId === 97n) {
    console.log(`https://testnet.bscscan.com/address/${address}`);
  }
  
  console.log('========================================\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment Failed:');
    console.error(error);
    process.exit(1);
  });
