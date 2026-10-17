// lib/redis.ts
import { createClient } from "redis";

// Track connection state more reliably
let isConnected = false;
let connectionAttempt = 0;
// NOTE: MAX_RETRY_ATTEMPTS is defined but not used in the provided functions, but kept here.
const MAX_RETRY_ATTEMPTS = 3;

const redis = createClient({
  url: `redis://default:${process.env.REDIS_PASSWORD}@redis-15000.c99.us-east-1-4.ec2.redns.redis-cloud.com:15000`,
  socket: {
    connectTimeout: 30000, // Increased from 10s to 30s for slow internet
    timeout: 45000, // Increased from 30s to 45s
    // ❌ FIX: Removed 'lazyConnect: true' as it is not a valid property here.
    // The client is lazy by default until redis.connect() is called.
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log("🔴 Max reconnection attempts reached");
        return new Error("Max retries exceeded");
      }
      // Exponential backoff with jitter for slow connections
      const baseDelay = Math.min(1000 * Math.pow(2, retries), 30000);
      const jitter = Math.random() * 1000;
      return baseDelay + jitter;
    },
  },
});

// Enhanced event listeners
redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    isConnected = false;
    console.log("🌐 Network-related Redis error - may be due to slow internet");
  }
});

redis.on("connect", () => {
  console.log("🔌 Redis: Connecting...");
  connectionAttempt++;
});

redis.on("ready", () => {
  console.log("✅ Redis: Connected and ready");
  isConnected = true;
  connectionAttempt = 0; // Reset on successful connection
});

redis.on("end", () => {
  console.log("🔌 Redis connection closed");
  isConnected = false;
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis: Reconnecting...");
});

export async function getRedisClient() {
  if (!isConnected) {
    try {
      // This explicit call ensures the connection attempt is made
      console.log(
        `Attempting Redis connection (attempt ${connectionAttempt + 1})...`,
      );

      await redis.connect();
      isConnected = true;
      console.log("✅ Successfully connected to Redis Cloud");
    } catch (error: any) {
      console.error("❌ Failed to connect to Redis Cloud:", error.message);

      // Specific handling for DNS/timeout issues
      if (error.code === "ENOTFOUND") {
        console.log("💡 Tip: This is often due to slow internet or DNS issues");
        console.log(
          "💡 Try: Using wired connection or checking network stability",
        );
      }

      if (error.code === "CONNECTION_TIMEOUT") {
        console.log("💡 Tip: Increase timeout values for slow connections");
      }

      throw error;
    }
  }
  return redis;
}

export async function closeRedis() {
  if (isConnected) {
    await redis.quit();
    isConnected = false;
    console.log("🔌 Redis connection closed");
  }
}

// Health check function
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    // Use client.ping() without arguments, which returns 'PONG'
    await client.ping();
    return true;
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}

// Safe Redis operations with fallbacks (string conversions handled implicitly by client)
export async function safeRedisGet(key: string, fallback: any = null) {
  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    // client.get returns a string or null
    return value ?? fallback;
  } catch (error) {
    console.error(`Redis get failed for key ${key}:`, error);
    return fallback;
  }
}

export async function safeRedisSet(
  key: string,
  value: string,
  options: { EX?: number } = {},
) {
  try {
    const client = await getRedisClient();
    // The modern client uses the object syntax for SET options
    if (options.EX) {
      await client.set(key, value, { EX: options.EX });
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    console.error(`Redis set failed for key ${key}:`, error);
    return false;
  }
}
