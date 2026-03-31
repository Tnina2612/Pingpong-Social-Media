/**
 * Feed Strategy Enum for A/B Testing
 *
 * Allows comparing different recommendation algorithms to optimize engagement.
 * Set via environment variable FEED_STRATEGY or database configuration.
 */
export enum FeedStrategy {
  /**
   * MIXED (Default): Combines friend posts, AI recommendations, and community trending.
   * Trade-off: More diverse, lower predictability, better for discovery.
   * Expected: Higher CTR on AI/community posts, increased session time.
   */
  MIXED = "MIXED",

  /**
   * FRIENDS_ONLY: Pure chronological friend feed without AI recommendations.
   * Trade-off: More predictable, lower discovery, faster to compute.
   * Baseline for comparison.
   */
  FRIENDS_ONLY = "FRIENDS_ONLY",

  /**
   * AI_FIRST: Prioritizes AI recommendations above friends.
   * Trade-off: Highly personalized, risk of filter bubble.
   * Expected: Highest engagement on recommendations, potential echo chamber.
   */
  AI_FIRST = "AI_FIRST",

  /**
   * COMMUNITY_FIRST: Prioritizes community-trending posts.
   * Trade-off: More social discovery, lower personalization.
   * Expected: Increase in group/page discovery, lower individual recommendations.
   */
  COMMUNITY_FIRST = "COMMUNITY_FIRST",
}
