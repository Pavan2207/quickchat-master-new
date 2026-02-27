import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Block a user
export const blockUser = mutation({
  args: {
    blockerId: v.string(),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already blocked
    const existing = await ctx.db
      .query("blockedUsers")
      .filter((q) =>
        q.and(
          q.eq(q.field("blockerId"), args.blockerId),
          q.eq(q.field("blockedId"), args.blockedId)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("blockedUsers", {
      blockerId: args.blockerId,
      blockedId: args.blockedId,
      createdAt: Date.now(),
    });
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    blockerId: v.string(),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    const blocked = await ctx.db
      .query("blockedUsers")
      .filter((q) =>
        q.and(
          q.eq(q.field("blockerId"), args.blockerId),
          q.eq(q.field("blockedId"), args.blockedId)
        )
      )
      .first();

    if (blocked) {
      await ctx.db.delete(blocked._id);
    }
  },
});

// Get blocked users
export const getBlockedUsers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const blocked = await ctx.db
      .query("blockedUsers")
      .filter((q) => q.eq(q.field("blockerId"), args.userId))
      .collect();

    // Get user details for each blocked user
    const blockedWithDetails = await Promise.all(
      blocked.map(async (b) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), b.blockedId))
          .first();
        return { ...b, user };
      })
    );

    return blockedWithDetails;
  },
});

// Check if user is blocked
export const isUserBlocked = query({
  args: {
    blockerId: v.string(),
    blockedId: v.string(),
  },
  handler: async (ctx, args) => {
    const blocked = await ctx.db
      .query("blockedUsers")
      .filter((q) =>
        q.and(
          q.eq(q.field("blockerId"), args.blockerId),
          q.eq(q.field("blockedId"), args.blockedId)
        )
      )
      .first();

    return !!blocked;
  },
});
