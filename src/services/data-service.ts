import axios from "axios";
import { logger } from "../utils/logger.js";
import { StakingProtocol, MarketData } from "../types/index.js";

export class DataService {
  private apiKeys: Record<string, string>;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor() {
    this.apiKeys = {
      coingecko: process.env.COINGECKO_API_KEY || "",
      defillama: process.env.DEFILLAMA_API_KEY || "",
      etherscan: process.env.ETHERSCAN_API_KEY || "",
    };
    this.cache = new Map();
  }

  async getAvailableProtocols(): Promise<StakingProtocol[]> {
    // Mock data - in real implementation would fetch from contracts/APIs
    return [
      {
        name: "lido",
        address: process.env.STAKING_ROUTER_LIDO_ADDRESS || "",
        type: "lido",
        currentAPR: 8.1,
        exchangeRate: 1.0,
        totalStaked: 0n,
        riskScore: 1.0,
        gasEfficiency: 85,
        withdrawalDelay: 1,
        maxAllocation: 40,
      },
      {
        name: "etherfi",
        address: process.env.STAKING_ROUTER_ETHERFI_ADDRESS || "",
        type: "etherfi",
        currentAPR: 8.4,
        exchangeRate: 1.0,
        totalStaked: 0n,
        riskScore: 2.0,
        gasEfficiency: 80,
        withdrawalDelay: 7,
        maxAllocation: 30,
      },
      {
        name: "rocketpool",
        address: process.env.STAKING_ROUTER_ROCKETPOOL_ADDRESS || "",
        type: "rocketpool",
        currentAPR: 7.9,
        exchangeRate: 1.1,
        totalStaked: 0n,
        riskScore: 1.5,
        gasEfficiency: 75,
        withdrawalDelay: 1,
        maxAllocation: 35,
      },
      {
        name: "morpho",
        address: process.env.STAKING_ROUTER_MORPHO_ADDRESS || "",
        type: "morpho",
        currentAPR: 9.2,
        exchangeRate: 1.05,
        totalStaked: 0n,
        riskScore: 3.0,
        gasEfficiency: 70,
        withdrawalDelay: 0,
        maxAllocation: 25,
      },
    ];
  }

  async getMarketData(): Promise<MarketData> {
    try {
      // Mock market data - in real implementation would fetch from APIs
      const marketData: MarketData = {
        gasPrice: 42,
        ethPrice: 2340,
        protocolAPRs: new Map([
          ["lido", 8.1],
          ["rocketpool", 7.9],
          ["etherfi", 8.4],
          ["morpho", 9.2],
        ]),
        protocolRisks: new Map([
          ["lido", 1.0],
          ["rocketpool", 1.5],
          ["etherfi", 2.0],
          ["morpho", 3.0],
        ]),
        timestamp: new Date(),
      };

      logger.info("Market data fetched successfully");
      return marketData;
    } catch (error) {
      logger.error("Failed to fetch market data:", error);
      throw error;
    }
  }

  private async getGasPrice(): Promise<number> {
    const cacheKey = "gas_price";
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Using ETH Gas Station API (free tier)
      const response = await axios.get(
        "https://ethgasstation.info/api/ethgasAPI.json"
      );
      const gasPrice = response.data.fast / 10; // Convert to gwei

      this.setCache(cacheKey, gasPrice, 30000); // 30 second TTL
      return gasPrice;
    } catch (error) {
      logger.warn("Failed to fetch gas price from API, using fallback");
      return 40; // Fallback gas price
    }
  }

  private async getETHPrice(): Promise<number> {
    const cacheKey = "eth_price";
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price",
        {
          params: {
            ids: "ethereum",
            vs_currencies: "usd",
          },
          headers: this.apiKeys.coingecko
            ? {
                "X-CG-Pro-API-Key": this.apiKeys.coingecko,
              }
            : {},
        }
      );

      const price = response.data.ethereum.usd;
      this.setCache(cacheKey, price, 60000); // 1 minute TTL
      return price;
    } catch (error) {
      logger.warn("Failed to fetch ETH price from CoinGecko");
      return 2300; // Fallback price
    }
  }

  private async getProtocolAPRs(): Promise<Map<string, number>> {
    const cacheKey = "protocol_aprs";
    const cached = this.getFromCache(cacheKey);
    if (cached) return new Map(cached);

    try {
      // Fetch from DeFiLlama yields API
      const response = await axios.get("https://yields.llama.fi/pools");
      const pools = response.data.data;

      const aprs = new Map<string, number>();

      // Map protocol pools to our naming
      const protocolMappings = {
        lido: ["ethereum-lido"],
        rocketpool: ["ethereum-rocket-pool"],
        etherfi: ["ethereum-ether.fi"],
        morpho: ["ethereum-morpho"],
      };

      for (const [protocol, searchTerms] of Object.entries(protocolMappings)) {
        const pool = pools.find((p: any) =>
          searchTerms.some(
            (term) =>
              p.project?.toLowerCase().includes(term.split("-")[1]) ||
              p.pool?.toLowerCase().includes(term.split("-")[1])
          )
        );

        if (pool) {
          aprs.set(protocol, pool.apy || pool.apyBase || 0);
        } else {
          // Fallback APRs
          const fallbacks = {
            lido: 8.1,
            rocketpool: 7.9,
            etherfi: 8.4,
            morpho: 9.2,
          };
          aprs.set(
            protocol,
            fallbacks[protocol as keyof typeof fallbacks] || 8.0
          );
        }
      }

      this.setCache(cacheKey, Array.from(aprs.entries()), 300000); // 5 minute TTL
      return aprs;
    } catch (error) {
      logger.warn("Failed to fetch protocol APRs, using defaults");

      return new Map([
        ["lido", 8.1],
        ["etherfi", 8.4],
        ["rocketpool", 7.9],
        ["morpho", 9.2],
      ]);
    }
  }

  private async getProtocolRisks(): Promise<Map<string, number>> {
    // Risk scores are typically calculated from multiple factors:
    // - TVL size (larger = lower risk)
    // - Time since launch
    // - Audit history
    // - Governance decentralization
    // - Smart contract complexity

    // For now, using static risk assessments
    return new Map([
      ["lido", 1.0], // Lowest risk - largest, most established
      ["rocketpool", 1.5], // Low risk - decentralized, good track record
      ["etherfi", 2.0], // Medium risk - newer but growing
      ["morpho", 3.0], // Higher risk - newer protocol, more complex
    ]);
  }

  async getHistoricalData(protocol: string, timeframe: string): Promise<any[]> {
    // Mock historical data - in real implementation would fetch from data providers
    const mockData = [];
    const now = Date.now();
    const interval =
      timeframe === "24h"
        ? 3600000 // 1 hour
        : timeframe === "7d"
          ? 3600000 * 6 // 6 hours
          : timeframe === "30d"
            ? 86400000 // 1 day
            : 86400000 * 7; // 1 week

    const points =
      timeframe === "24h"
        ? 24
        : timeframe === "7d"
          ? 28
          : timeframe === "30d"
            ? 30
            : 12;

    for (let i = 0; i < points; i++) {
      const timestamp = now - i * interval;
      const baseAPR = 8.0;
      const volatility = 0.5;
      const apr = baseAPR + (Math.random() - 0.5) * volatility;

      mockData.unshift({
        timestamp,
        apr: Number(apr.toFixed(3)),
        tvl: 1000000 + Math.random() * 100000,
      });
    }

    return mockData;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async getProtocolAPR(protocol: string): Promise<number> {
    // Mock APR data
    const aprs: Record<string, number> = {
      lido: 8.1,
      rocketpool: 7.9,
      etherfi: 8.4,
      morpho: 9.2,
    };

    return aprs[protocol] || 7.0;
  }

  async getProtocolTVL(protocol: string): Promise<string> {
    // Mock TVL data
    const tvls: Record<string, string> = {
      lido: "8.2B",
      rocketpool: "1.8B",
      etherfi: "2.1B",
      morpho: "0.9B",
    };

    return tvls[protocol] || "0";
  }
}
