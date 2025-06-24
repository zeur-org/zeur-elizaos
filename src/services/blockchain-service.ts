import { ethers } from "ethers";
import { logger } from "../utils/logger.js";
import { StakingProtocol, RebalanceTransaction } from "../types/index.js";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contracts: Map<string, ethers.Contract>;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    this.contracts = new Map();
    this.initializeContracts();
  }

  private initializeContracts() {
    // ABI definitions for the staking routers
    const stakingRouterABI = [
      "function stake(address from, uint256 amount) external payable",
      "function unstake(address to, uint256 amount) external",
      "function getExchangeRate() external view returns (uint256)",
      "function getStakedToken() external view returns (address)",
      "function getTotalStakedUnderlying() external view returns (uint256)",
      "function getStakedTokenAndExchangeRate() external view returns (address, uint256)",
    ];

    const vaultETHABI = [
      "function lockCollateral(address from, uint256 amount) external payable",
      "function unlockCollateral(address to, uint256 amount) external",
      "function getCurrentStakingRouter() external view returns (address)",
      "function getCurrentUnstakingRouter() external view returns (address)",
      "function updateCurrentStakingRouter(address router) external",
      "function updateCurrentUnstakingRouter(address router) external",
    ];

    // Initialize VaultETH contract
    if (process.env.VAULT_ETH_ADDRESS) {
      this.contracts.set(
        "vaultETH",
        new ethers.Contract(
          process.env.VAULT_ETH_ADDRESS,
          vaultETHABI,
          this.wallet
        )
      );
    }

    // Initialize staking router contracts
    const routerAddresses = {
      lido: process.env.STAKING_ROUTER_LIDO_ADDRESS,
      etherfi: process.env.STAKING_ROUTER_ETHERFI_ADDRESS,
      rocketpool: process.env.STAKING_ROUTER_ROCKETPOOL_ADDRESS,
      morpho: process.env.STAKING_ROUTER_MORPHO_ADDRESS,
    };

    for (const [name, address] of Object.entries(routerAddresses)) {
      if (address) {
        this.contracts.set(
          name,
          new ethers.Contract(address, stakingRouterABI, this.wallet)
        );
      }
    }
  }

  async getGasPrice(): Promise<number> {
    try {
      const feeData = await this.provider.getFeeData();
      return Number(ethers.formatUnits(feeData.gasPrice || 0n, "gwei"));
    } catch (error) {
      logger.error("Failed to get gas price:", error);
      return 50; // Default fallback
    }
  }

  async getETHBalance(address: string): Promise<bigint> {
    try {
      return await this.provider.getBalance(address);
    } catch (error) {
      logger.error("Failed to get ETH balance:", error);
      return 0n;
    }
  }

  async getProtocolData(
    protocolName: string
  ): Promise<Partial<StakingProtocol> | null> {
    try {
      const contract = this.contracts.get(protocolName);
      if (!contract) {
        logger.warn(`Contract not found for protocol: ${protocolName}`);
        return null;
      }

      const [stakedToken, exchangeRate] =
        await contract.getStakedTokenAndExchangeRate();
      const totalStaked = await contract.getTotalStakedUnderlying();

      return {
        address: await contract.getAddress(),
        exchangeRate: Number(ethers.formatEther(exchangeRate)),
        totalStaked: totalStaked,
      };
    } catch (error) {
      logger.error(`Failed to get protocol data for ${protocolName}:`, error);
      return null;
    }
  }

  async getCurrentStakingRouter(): Promise<string | null> {
    try {
      const vaultETH = this.contracts.get("vaultETH");
      if (!vaultETH) return null;

      return await vaultETH.getCurrentStakingRouter();
    } catch (error) {
      logger.error("Failed to get current staking router:", error);
      return null;
    }
  }

  async setStakingRouter(routerAddress: string): Promise<boolean> {
    try {
      const vaultETH = this.contracts.get("vaultETH");
      if (!vaultETH) return false;

      const tx = await vaultETH.updateCurrentStakingRouter(routerAddress);
      await tx.wait();

      logger.info(`Updated staking router to: ${routerAddress}`);
      return true;
    } catch (error) {
      logger.error("Failed to set staking router:", error);
      return false;
    }
  }

  async executeStake(
    protocolName: string,
    amount: bigint
  ): Promise<string | null> {
    try {
      const vaultETH = this.contracts.get("vaultETH");
      if (!vaultETH) return null;

      // First set the appropriate staking router
      const routerAddress = this.contracts.get(protocolName)?.target;
      if (!routerAddress) return null;

      await this.setStakingRouter(routerAddress as string);

      // Execute stake through VaultETH
      const tx = await vaultETH.lockCollateral(
        await this.wallet.getAddress(),
        amount,
        { value: amount }
      );

      const receipt = await tx.wait();
      logger.info(`Stake executed: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      logger.error(`Failed to execute stake for ${protocolName}:`, error);
      return null;
    }
  }

  async executeUnstake(
    protocolName: string,
    amount: bigint
  ): Promise<string | null> {
    try {
      const vaultETH = this.contracts.get("vaultETH");
      if (!vaultETH) return null;

      // Set the appropriate unstaking router
      const routerAddress = this.contracts.get(protocolName)?.target;
      if (!routerAddress) return null;

      await vaultETH.updateCurrentUnstakingRouter(routerAddress);

      // Execute unstake through VaultETH
      const tx = await vaultETH.unlockCollateral(
        await this.wallet.getAddress(),
        amount
      );

      const receipt = await tx.wait();
      logger.info(`Unstake executed: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      logger.error(`Failed to execute unstake for ${protocolName}:`, error);
      return null;
    }
  }

  async estimateGas(
    contractAddress: string,
    method: string,
    params: any[]
  ): Promise<bigint> {
    try {
      const contract = this.contracts.get(contractAddress);
      if (!contract) return 0n;

      return await contract[method].estimateGas(...params);
    } catch (error) {
      logger.error("Failed to estimate gas:", error);
      return 200000n; // Default fallback
    }
  }

  async getTransactionStatus(txHash: string): Promise<string> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return "pending";

      return receipt.status === 1 ? "completed" : "failed";
    } catch (error) {
      logger.error("Failed to get transaction status:", error);
      return "unknown";
    }
  }

  async waitForTransaction(
    txHash: string,
    timeout: number = 300000
  ): Promise<boolean> {
    try {
      const receipt = await this.provider.waitForTransaction(
        txHash,
        1,
        timeout
      );
      return receipt?.status === 1;
    } catch (error) {
      logger.error("Transaction timeout or failed:", error);
      return false;
    }
  }
}
