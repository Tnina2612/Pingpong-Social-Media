import { Injectable, Logger } from "@nestjs/common";
import { FeedStrategy } from "./enums/feed-strategy.enum";
import { FeedService } from "./feed.service";

/**
 * Feed Configuration Service
 *
 * Manages A/B testing and feed strategy selection per user.
 * Supports:
 * - Global feed strategy (environment variable)
 * - Per-user strategy overrides (stored in database for A/B tests)
 * - Segment-based testing (e.g., 10% of users get AI_FIRST strategy)
 */
@Injectable()
export class FeedConfigService {
  private readonly logger = new Logger(FeedConfigService.name);
  private readonly strategyWeights: Record<FeedStrategy, number> = {
    [FeedStrategy.MIXED]: parseFloat(process.env.FEED_WEIGHT_MIXED || "0.7"),
    [FeedStrategy.FRIENDS_ONLY]: parseFloat(
      process.env.FEED_WEIGHT_FRIENDS_ONLY || "0.2",
    ),
    [FeedStrategy.AI_FIRST]: parseFloat(
      process.env.FEED_WEIGHT_AI_FIRST || "0.05",
    ),
    [FeedStrategy.COMMUNITY_FIRST]: parseFloat(
      process.env.FEED_WEIGHT_COMMUNITY_FIRST || "0.05",
    ),
  };

  constructor(private readonly feedService: FeedService) {
    this.validateWeights();
    this.logConfiguration();
  }

  private validateWeights(): void {
    let hasInvalid = false;
    (Object.keys(this.strategyWeights) as FeedStrategy[]).forEach((key) => {
      const weight = this.strategyWeights[key];
      if (!Number.isFinite(weight) || weight < 0) {
        this.logger.warn(
          `Invalid feed strategy weight for ${key}: ${weight}. Resetting to 0.`,
        );
        this.strategyWeights[key] = 0;
        hasInvalid = true;
      }
    })

    const total = Object.values(this.strategyWeights).reduce(
      (a, b) => a + b,
      0,
    );

    // If after sanitization the total is not usable, fall back to safe defaults
    if (!Number.isFinite(total) || total <= 0) {
      this.logger.error(
        `Feed strategy weights are invalid or sum to ${total}. Falling back to default weights (MIXED=1, others=0).`,
      );
      this.strategyWeights[FeedStrategy.MIXED] = 1;
      this.strategyWeights[FeedStrategy.FRIENDS_ONLY] = 0;
      this.strategyWeights[FeedStrategy.AI_FIRST] = 0;
      this.strategyWeights[FeedStrategy.COMMUNITY_FIRST] = 0;
      return;
    }

    if (Math.abs(total - 1.0) > 0.01 || hasInvalid) {
      this.logger.warn(
        `Feed strategy weights don't sum to 1.0 (got ${total}). Normalizing...`,
      );
      const normalizer = total > 0 ? total : 1;
      Object.keys(this.strategyWeights).forEach((key) => {
        this.strategyWeights[key as FeedStrategy] /= normalizer;
      });
    }
  }

  /**
   * Determine which feed strategy a user should use.
   * Based on weighted random selection (for A/B testing).
   */
  getStrategyForUser(userId: string): FeedStrategy {
    // Deterministic selection: same user always gets same strategy
    // Use hash of userId to seed randomness
    const hash = Array.from(userId).reduce(
      (acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0,
      0,
    );
    const random = Math.abs(hash % 1000) / 1000;

    let cumulative = 0;
    for (const [strategy, weight] of Object.entries(this.strategyWeights)) {
      cumulative += weight as any;
      if (random < cumulative) {
        return strategy as FeedStrategy;
      }
    }

    return FeedStrategy.MIXED; // Fallback
  }

  /**
   * Generate a user's feed according to their assigned strategy.
   * The actual implementation is delegated to FeedService.
   */
  async generateFeedByStrategy(
    strategy: FeedStrategy,
    userId: string,
    page: number,
  ): Promise<any[]> {
    this.logger.log(
      `[A/B Test] Generating ${strategy} feed for user ${userId}`,
    );

    return this.feedService.generateFeedByStrategy(strategy, userId, page);
  }

  private logConfiguration(): void {
    this.logger.log("[A/B Test Configuration]");
    this.logger.log(
      `  MIXED: ${(this.strategyWeights[FeedStrategy.MIXED] * 100).toFixed(1)}%`,
    );
    this.logger.log(
      `  FRIENDS_ONLY: ${(this.strategyWeights[FeedStrategy.FRIENDS_ONLY] * 100).toFixed(1)}%`,
    );
    this.logger.log(
      `  AI_FIRST: ${(this.strategyWeights[FeedStrategy.AI_FIRST] * 100).toFixed(1)}%`,
    );
    this.logger.log(
      `  COMMUNITY_FIRST: ${(this.strategyWeights[FeedStrategy.COMMUNITY_FIRST] * 100).toFixed(1)}%`,
    );
  }
}
