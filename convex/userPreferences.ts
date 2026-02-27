import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return preferences;
  },
});

export const updateNotificationSound = mutation({
  args: { userId: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        notificationSound: args.enabled,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        notificationSound: args.enabled,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getConversationWallpaper = query({
  args: { userId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const wallpaper = await ctx.db
      .query("conversationWallpapers")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    return wallpaper?.wallpaper || "default";
  },
});

export const setConversationWallpaper = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    wallpaper: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversationWallpapers")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        wallpaper: args.wallpaper,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("conversationWallpapers", {
        userId: args.userId,
        conversationId: args.conversationId,
        wallpaper: args.wallpaper,
        updatedAt: Date.now(),
      });
    }
  },
});
