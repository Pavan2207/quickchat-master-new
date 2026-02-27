import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Set typing status
export const setTypingStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingStatus")
      .filter(
        (q) =>
          q.and(
            q.eq(q.field("conversationId"), args.conversationId),
            q.eq(q.field("userId"), args.userId)
          )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingStatus", {
        conversationId: args.conversationId,
        userId: args.userId,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get typing status for a conversation (excluding current user)
export const getTypingStatus = query({
  args: { conversationId: v.id("conversations"), excludeUserId: v.string() },
  handler: async (ctx, args) => {
    const typingStatuses = await ctx.db
      .query("typingStatus")
      .filter(
        (q) =>
          q.and(
            q.eq(q.field("conversationId"), args.conversationId),
            q.neq(q.field("userId"), args.excludeUserId)
          )
      )
      .collect();

    return typingStatuses.filter((t) => t.isTyping);
  },
});
