import { Injectable } from '@nestjs/common';

interface RateLimitConfig {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

interface LimiterState {
  requests: number[];
  config: RateLimitConfig;
}

@Injectable()
export class RateLimiterService {
  private limiters: Map<string, LimiterState> = new Map();

  /**
   * Register a rate limiter for a specific source
   */
  registerLimiter(source: string, config: RateLimitConfig) {
    this.limiters.set(source, {
      requests: [],
      config,
    });
  }

  /**
   * Wait if necessary to respect rate limits
   */
  async throttle(source: string): Promise<void> {
    const limiter = this.limiters.get(source);
    if (!limiter) {
      return; // No limiter configured
    }

    const now = Date.now();
    const { config, requests } = limiter;

    // Clean old requests
    this.cleanOldRequests(limiter, now);

    // Check each limit type
    const delays: number[] = [];

    if (config.requestsPerSecond) {
      const recentRequests = requests.filter((t) => now - t < 1000);
      if (recentRequests.length >= config.requestsPerSecond) {
        delays.push(1000 - (now - recentRequests[0]));
      }
    }

    if (config.requestsPerMinute) {
      const recentRequests = requests.filter((t) => now - t < 60000);
      if (recentRequests.length >= config.requestsPerMinute) {
        delays.push(60000 - (now - recentRequests[0]));
      }
    }

    if (config.requestsPerHour) {
      const recentRequests = requests.filter((t) => now - t < 3600000);
      if (recentRequests.length >= config.requestsPerHour) {
        delays.push(3600000 - (now - recentRequests[0]));
      }
    }

    if (config.requestsPerDay) {
      const recentRequests = requests.filter((t) => now - t < 86400000);
      if (recentRequests.length >= config.requestsPerDay) {
        delays.push(86400000 - (now - recentRequests[0]));
      }
    }

    // Wait for the longest delay
    if (delays.length > 0) {
      const maxDelay = Math.max(...delays);
      await new Promise((resolve) => setTimeout(resolve, maxDelay));
    }

    // Record this request
    requests.push(Date.now());
  }

  /**
   * Remove old request timestamps
   */
  private cleanOldRequests(limiter: LimiterState, now: number) {
    const { config, requests } = limiter;

    // Determine the longest window we need to track
    let maxWindow = 0;
    if (config.requestsPerDay) maxWindow = 86400000;
    else if (config.requestsPerHour) maxWindow = 3600000;
    else if (config.requestsPerMinute) maxWindow = 60000;
    else if (config.requestsPerSecond) maxWindow = 1000;

    // Remove requests older than our longest window
    limiter.requests = requests.filter((t) => now - t < maxWindow);
  }

  /**
   * Get current usage stats for a source
   */
  getUsageStats(source: string) {
    const limiter = this.limiters.get(source);
    if (!limiter) {
      return null;
    }

    const now = Date.now();
    this.cleanOldRequests(limiter, now);

    const { requests, config } = limiter;

    return {
      source,
      lastSecond: requests.filter((t) => now - t < 1000).length,
      lastMinute: requests.filter((t) => now - t < 60000).length,
      lastHour: requests.filter((t) => now - t < 3600000).length,
      lastDay: requests.filter((t) => now - t < 86400000).length,
      limits: config,
    };
  }

  /**
   * Reset rate limiter for a source
   */
  reset(source: string) {
    const limiter = this.limiters.get(source);
    if (limiter) {
      limiter.requests = [];
    }
  }
}
