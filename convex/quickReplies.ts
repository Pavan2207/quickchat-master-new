import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createQuickReply = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("quickReplies", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const getQuickReplies = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quickReplies")
      .withIndex("by_user_createdAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const deleteQuickReply = mutation({
  args: {
    quickReplyId: v.id("quickReplies"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.quickReplyId);
  },
});

export const updateQuickReply = mutation({
  args: {
    quickReplyId: v.id("quickReplies"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.quickReplyId, {
      title: args.title,
      content: args.content,
    });
  },
});
