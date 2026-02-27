import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all conversations for a user
export const getConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("conversationMembers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const conversations = await Promise.all(
      members.map(async (member) => {
        const conversation = await ctx.db.get(member.conversationId);
        return {
          ...conversation,
          lastReadAt: member.lastReadAt,
          unreadCount: member.unreadCount,
          isArchived: member.isArchived ?? false,
          muteUntil: member.muteUntil ?? 0,
          labels: member.labels ?? [],
          disappearingSeconds: member.disappearingSeconds ?? 0,
        };
      })
    );

    return conversations.sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
  },
});

// Get or create a direct conversation between two users
export const getOrCreateDirectConversation = mutation({
  args: { userId1: v.string(), userId2: v.string() },
  handler: async (ctx, args): Promise<Id<"conversations">> => {
    const existingConversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("type"), "direct"))
      .collect();

    const conversation = existingConversations.find(
      (c) =>
        c.members.includes(args.userId1) && c.members.includes(args.userId2)
    );

    if (conversation) {
      return conversation._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      type: "direct",
      members: [args.userId1, args.userId2],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add both users as members
    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.userId1,
      lastReadAt: Date.now(),
      unreadCount: 0,
      isArchived: false,
      muteUntil: 0,
      labels: [],
      disappearingSeconds: 0,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.userId2,
      lastReadAt: Date.now(),
      unreadCount: 0,
      isArchived: false,
      muteUntil: 0,
      labels: [],
      disappearingSeconds: 0,
    });

    return conversationId;
  },
});

// Create a group conversation
export const createGroupConversation = mutation({
  args: {
    name: v.string(),
    members: v.array(v.string()),
    admin: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"conversations">> => {
    const conversationId = await ctx.db.insert("conversations", {
      type: "group",
      name: args.name,
      members: args.members,
      admin: args.admin,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add all members
    for (const memberId of args.members) {
      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId: memberId,
        lastReadAt: Date.now(),
        unreadCount: 0,
        isArchived: false,
        muteUntil: 0,
        labels: [],
        disappearingSeconds: 0,
      });
    }

    return conversationId;
  },
});

// Get a single conversation
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    return conversation;
  },
});

// Mark conversation as read
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .filter(
        (q) =>
          q.and(
            q.eq(q.field("conversationId"), args.conversationId),
            q.eq(q.field("userId"), args.userId)
          )
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, {
        lastReadAt: Date.now(),
        unreadCount: 0,
      });
    }
  },
});

// Get conversation members
export const getConversationMembers = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("conversationMembers")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    const users = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("userId"), member.userId))
          .first();
        return { ...user, memberInfo: member };
      })
    );

    return users;
  },
});

// Update per-user chat settings
export const setConversationArchived = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    isArchived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
    if (!member) return;
    await ctx.db.patch(member._id, { isArchived: args.isArchived });
  },
});

export const setConversationMuted = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    muteUntil: v.number(), // timestamp, 0 to unmute
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
    if (!member) return;
    await ctx.db.patch(member._id, { muteUntil: args.muteUntil });
  },
});

export const setConversationLabels = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    labels: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
    if (!member) return;
    await ctx.db.patch(member._id, { labels: args.labels });
  },
});

export const setDisappearingMessages = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    disappearingSeconds: v.number(), // 0 to disable
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
    if (!member) return;
    await ctx.db.patch(member._id, { disappearingSeconds: args.disappearingSeconds });
  },
});
