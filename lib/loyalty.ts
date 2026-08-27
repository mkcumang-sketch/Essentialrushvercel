import mongoose from "mongoose";
import UserModel, {
  LOYALTY_TIERS,
  getLoyaltyTier,
  getLoyaltyDiscount,
  IUser,
} from "@/models/usertemp";
import connectDB from "./mongodb";

// ============================================================================
// LOYALTY TIER SYNC & UPDATE FUNCTIONS
// ============================================================================

/**
 * Update a single user's loyalty tier based on their total spent
 * @param userId - User ID to update
 * @returns Tier change info or null if no change
 */
export async function updateUserLoyalty(
  userId: string | mongoose.Types.ObjectId
) {
  try {
    await connectDB();

    const userDoc = await UserModel.findById(userId);
    if (!userDoc) {
      return null;
    }

    const currentTier = userDoc.loyaltyTier;
    const newTier = getLoyaltyTier(userDoc.totalSpent);

    if (newTier !== currentTier) {
      const oldTierInfo = LOYALTY_TIERS.find((t) => t.name === currentTier);
      const newTierInfo = LOYALTY_TIERS.find((t) => t.name === newTier);

      userDoc.loyaltyTier = newTier;
      userDoc.tierUpgradedAt = new Date();
      userDoc.loyaltyPoints = (userDoc.loyaltyPoints || 0) + (newTierInfo?.discount || 0) * 100;

      await userDoc.addNotification(
        `🎉 Upgraded to ${newTier}!`,
        `You've been upgraded from ${currentTier} to ${newTier}. Enjoy ${newTierInfo?.discount}% extra discount on all orders!`,
        true
      );

      return {
        userId: userDoc._id,
        oldTier: currentTier,
        newTier: newTier,
        oldDiscount: oldTierInfo?.discount || 0,
        newDiscount: newTierInfo?.discount || 0,
        bonusPoints: (newTierInfo?.discount || 0) * 100,
      };
    }

    return null;
  } catch (error) {
    console.error("Error updating user loyalty:", error);
    throw error;
  }
}

/**
 * Sync loyalty tiers for all users with spending
 * @returns Summary of users synced and upgraded
 */
export async function syncAllUserLoyalties() {
  try {
    await connectDB();

    const users = await UserModel.find({ totalSpent: { $gt: 0 } });

    let upgraded = 0;
    let errors = 0;
    const upgradedUsers: Array<{
      userId: mongoose.Types.ObjectId;
      oldTier: string;
      newTier: string;
    }> = [];

    for (const user of users) {
      try {
        const newTier = getLoyaltyTier(user.totalSpent);
        if (newTier !== user.loyaltyTier) {
          const oldTier = user.loyaltyTier;
          user.loyaltyTier = newTier;
          user.tierUpgradedAt = new Date();
          await user.save();
          upgraded++;
          upgradedUsers.push({
            userId: user._id,
            oldTier,
            newTier,
          });
        }
      } catch (err) {
        console.error(`Failed to update user ${user._id}:`, err);
        errors++;
      }
    }

    return {
      total: users.length,
      upgraded,
      errors,
      upgradedUsers,
    };
  } catch (error) {
    console.error("Error syncing user loyalties:", error);
    throw error;
  }
}

/**
 * Calculate checkout discount based on loyalty tier
 * @param subtotal - Order subtotal
 * @param totalSpent - User's total spending
 * @param existingDiscount - Any existing discount
 * @returns Discount info with tier and amount
 */
export function calculateCheckoutDiscount(
  subtotal: number,
  totalSpent: number,
  existingDiscount: number = 0
): {
  discount: number;
  tier: string;
  tierDiscount: number;
  savings: number;
} {
  if (subtotal < 0) {
    throw new Error("Subtotal cannot be negative");
  }
  if (totalSpent < 0) {
    throw new Error("Total spent cannot be negative");
  }

  const tier = getLoyaltyTier(totalSpent);
  const tierDiscount = getLoyaltyDiscount(totalSpent);
  const loyaltyDiscountAmount = (subtotal * tierDiscount) / 100;
  const finalDiscount = Math.max(loyaltyDiscountAmount, existingDiscount);

  return {
    discount: Math.round(finalDiscount * 100) / 100,
    tier,
    tierDiscount,
    savings: Math.round(finalDiscount * 100) / 100,
  };
}

/**
 * Batch update multiple users' loyalty status
 * @param userIds - Array of user IDs to update
 * @returns Summary of updates
 */
export async function batchUpdateUserLoyalties(
  userIds: (string | mongoose.Types.ObjectId)[]
) {
  try {
    await connectDB();

    const results = {
      total: userIds.length,
      upgraded: 0,
      unchanged: 0,
      errors: 0,
      upgradedDetails: [] as Array<{
        userId: mongoose.Types.ObjectId;
        oldTier: string;
        newTier: string;
      }>,
    };

    for (const userId of userIds) {
      try {
        const result = await updateUserLoyalty(userId);
        if (result) {
          results.upgraded++;
          results.upgradedDetails.push({
            userId: result.userId,
            oldTier: result.oldTier,
            newTier: result.newTier,
          });
        } else {
          results.unchanged++;
        }
      } catch (err) {
        console.error(`Failed to update user ${userId}:`, err);
        results.errors++;
      }
    }

    return results;
  } catch (error) {
    console.error("Error in batch update:", error);
    throw error;
  }
}

/**
 * Get users nearing tier upgrade with spending breakdown
 * @returns Array of users close to next tier
 */
export async function getUsersNearingTierUpgrade() {
  try {
    await connectDB();

    const tiersWithThresholds = LOYALTY_TIERS.map((tier, idx) => ({
      ...tier,
      nextTier: LOYALTY_TIERS[idx + 1] || null,
    }));

    const nearingUpgrade = [];

    for (const tier of tiersWithThresholds) {
      if (!tier.nextTier) continue;

      const threshold = tier.nextTier.minSpent;
      const users = await UserModel.find({
        totalSpent: {
          $gte: tier.minSpent,
          $lt: threshold,
          $gt: threshold * 0.8, // Within 80% of next tier
        },
        loyaltyTier: tier.name,
      });

      nearingUpgrade.push({
        currentTier: tier.name,
        nextTier: tier.nextTier.name,
        spendRequired: threshold - (users[0]?.totalSpent || 0),
        userCount: users.length,
        users: users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          totalSpent: u.totalSpent,
          spendNeeded: threshold - u.totalSpent,
        })),
      });
    }

    return nearingUpgrade;
  } catch (error) {
    console.error("Error getting users nearing tier upgrade:", error);
    throw error;
  }
}

/**
 * Reward loyal customers with bonus points
 * @param minTotalSpent - Minimum spending threshold
 * @param bonusPoints - Points to award
 * @returns Count of users rewarded
 */
export async function rewardLoyalCustomers(
  minTotalSpent: number = 1000,
  bonusPoints: number = 100
) {
  try {
    await connectDB();

    const result = await UserModel.updateMany(
      { totalSpent: { $gte: minTotalSpent } },
      {
        $inc: { loyaltyPoints: bonusPoints },
      }
    );

    return {
      updatedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      message: `Rewarded ${result.modifiedCount} users with ${bonusPoints} loyalty points`,
    };
  } catch (error) {
    console.error("Error rewarding loyal customers:", error);
    throw error;
  }
}

/**
 * Get loyalty tier statistics
 * @returns Breakdown of users by tier
 */
export async function getLoyaltyStatistics() {
  try {
    await connectDB();

    const stats = await UserModel.aggregate([
      {
        $group: {
          _id: "$loyaltyTier",
          count: { $sum: 1 },
          avgSpent: { $avg: "$totalSpent" },
          totalSpent: { $sum: "$totalSpent" },
          avgLoyaltyPoints: { $avg: "$loyaltyPoints" },
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
    ]);

    const formattedStats = stats.map((stat) => {
      const tierInfo = LOYALTY_TIERS.find((t) => t.name === stat._id);
      return {
        tier: stat._id,
        discount: tierInfo?.discount || 0,
        userCount: stat.count,
        averageSpent: Math.round(stat.avgSpent * 100) / 100,
        totalSpent: Math.round(stat.totalSpent * 100) / 100,
        averageLoyaltyPoints: Math.round(stat.avgLoyaltyPoints * 100) / 100,
      };
    });

    return formattedStats;
  } catch (error) {
    console.error("Error getting loyalty statistics:", error);
    throw error;
  }
}