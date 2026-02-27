import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    viewerId: v.optional(v.string()),
    before: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.max(1, Math.min(args.limit ?? 100, 200));
    const before = args.before ?? Number.MAX_SAFE_INTEGER;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) =>
        q.eq("conversationId", args.conversationId).lt("createdAt", before)
      )
      .order("desc")
      .take(limit);

    // Hide expired disappearing messages
    const visible = messages.filter((m) => (m.expiresAt ? m.expiresAt > now : true));

    // For view-once media: if viewer has already viewed it, redact mediaUrl
    const viewerId = args.viewerId;
    const sanitized = visible.map((m) => {
      if (!m.viewOnce || !viewerId) return m;
      if (m.senderId === viewerId) return m; // sender can always see their own media
      const viewedBy = m.viewedBy ?? [];
      if (!viewedBy.includes(viewerId)) return m;
      return {
        ...m,
        mediaUrl: undefined,
        content: m.content || "View-once media",
      };
    });

    return sanitized.reverse();
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.string()),
    replyTo: v.optional(v.id("messages")),
    // Optional timers
    viewOnce: v.optional(v.boolean()),
    expiresInSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    const now = Date.now();
    let expiresAt: number | undefined;
    if (args.expiresInSeconds && args.expiresInSeconds > 0) {
      expiresAt = now + args.expiresInSeconds * 1000;
    } else {
      // Fall back to conversation setting if present
      const member = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation_user", (q) =>
          q.eq("conversationId", args.conversationId).eq("userId", args.senderId)
        )
        .first();
      if (member?.disappearingSeconds && member.disappearingSeconds > 0) {
        expiresAt = now + member.disappearingSeconds * 1000;
      }
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      replyTo: args.replyTo,
      deleted: false,
      reactions: {},
      pinned: false,
      viewOnce: args.viewOnce ?? false,
      viewedBy: [],
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Update conversation's updatedAt
    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, { updatedAt: Date.now() });
    }

    // Increment unread count for other members
    const members = await ctx.db
      .query("conversationMembers")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    for (const member of members) {
      if (member.userId !== args.senderId) {
        await ctx.db.patch(member._id, {
          unreadCount: member.unreadCount + 1,
        });
      }
    }

    return messageId;
  },
});

// Delete a message (soft delete)
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { deleted: true });
  },
});

// Pin/unpin a message
export const pinMessage = mutation({
  args: {
    messageId: v.id("messages"),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.messageId, {
      pinned: args.pinned,
      pinnedAt: args.pinned ? now : undefined,
      updatedAt: now,
    });
  },
});

// Get pinned messages for a conversation
export const getPinnedMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pinned = await ctx.db
      .query("messages")
      .withIndex("by_conversation_pinnedAt", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("pinned"), true))
      .order("desc")
      .take(50);

    return pinned.filter((m) => (m.expiresAt ? m.expiresAt > now : true)).reverse();
  },
});

// Drafts
export const saveDraft = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messageDrafts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("messageDrafts", {
      conversationId: args.conversationId,
      userId: args.userId,
      content: args.content,
      updatedAt: now,
    });
  },
});

export const getDraft = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageDrafts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
  },
});

export const deleteDraft = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messageDrafts")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Star / bookmark a message
export const starMessage = mutation({
  args: {
    userId: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const existing = await ctx.db
      .query("starredMessages")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", args.userId).eq("messageId", args.messageId)
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("starredMessages", {
      userId: args.userId,
      messageId: args.messageId,
      conversationId: message.conversationId,
      starredAt: Date.now(),
    });
  },
});

export const unstarMessage = mutation({
  args: {
    userId: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("starredMessages")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", args.userId).eq("messageId", args.messageId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const isMessageStarred = query({
  args: {
    userId: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("starredMessages")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", args.userId).eq("messageId", args.messageId)
      )
      .first();
    return !!existing;
  },
});

export const getStarredMessages = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 100, 200));
    const starred = await ctx.db
      .query("starredMessages")
      .withIndex("by_user_starredAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const messages = await Promise.all(
      starred.map(async (s) => {
        const msg = await ctx.db.get(s.messageId);
        return msg ? { starredAt: s.starredAt, message: msg } : null;
      })
    );

    return messages.filter(Boolean);
  },
});

// Mark view-once media as viewed
export const markMediaViewed = mutation({
  args: {
    messageId: v.id("messages"),
    viewerId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;
    if (!message.viewOnce) return;
    if (message.senderId === args.viewerId) return;

    const viewedBy = message.viewedBy ?? [];
    if (viewedBy.includes(args.viewerId)) return;
    await ctx.db.patch(args.messageId, { viewedBy: [...viewedBy, args.viewerId], updatedAt: Date.now() });
  },
});

// React to a message
export const reactToMessage = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    type ReactionEntry = { emoji: string; userIds: string[] };

    const raw = message.reactions ?? [];
    let reactions: ReactionEntry[];

    if (Array.isArray(raw)) {
      // Preferred format: array of { emoji, userIds }
      if (raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "emoji" in raw[0]) {
        reactions = raw as ReactionEntry[];
      } else {
        reactions = [];
      }
    } else if (raw && typeof raw === "object") {
      // Legacy record format { "👍": ["user1"], ... }
      reactions = Object.entries(raw as Record<string, string[]>).map(([emoji, userIds]) => ({
        emoji,
        userIds: Array.isArray(userIds) ? userIds : [],
      }));
    } else {
      reactions = [];
    }

    const idx = reactions.findIndex((r) => r.emoji === args.emoji);
    if (idx === -1) {
      // Add first reaction for this emoji
      reactions.push({ emoji: args.emoji, userIds: [args.userId] });
    } else {
      const entry = reactions[idx];
      const hasUser = entry.userIds.includes(args.userId);
      if (hasUser) {
        // Remove reaction for this user
        const nextUserIds = entry.userIds.filter((id) => id !== args.userId);
        if (nextUserIds.length === 0) {
          reactions.splice(idx, 1);
        } else {
          reactions[idx] = { ...entry, userIds: nextUserIds };
        }
      } else {
        reactions[idx] = { ...entry, userIds: [...entry.userIds, args.userId] };
      }
    }

    await ctx.db.patch(args.messageId, {
      reactions,
      updatedAt: Date.now(),
    });
  },
});

// Get total unread count
export const getTotalUnreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("conversationMembers")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return members.reduce((total, member) => total + member.unreadCount, 0);
  },
});

// Search messages in a conversation
export const searchMessages = query({
  args: { conversationId: v.id("conversations"), searchQuery: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();

    // Filter by search query (case-insensitive)
    const query = args.searchQuery.toLowerCase();
    return messages
      .filter((msg) => !msg.deleted && msg.content.toLowerCase().includes(query))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Global search across chats (simple scan over user's conversations)
export const globalSearch = query({
  args: { userId: v.string(), searchQuery: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));
    const q = args.searchQuery.trim().toLowerCase();
    if (!q) return [];

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("userId", (qq) => qq.eq("userId", args.userId))
      .collect();

    const convoIds = memberships.map((m) => m.conversationId);
    const results: Array<{
      conversationId: Id<"conversations">;
      messageId: Id<"messages">;
      content: string;
      senderId: string;
      createdAt: number;
    }> = [];

    for (const cid of convoIds) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation_createdAt", (qq) => qq.eq("conversationId", cid))
        .order("desc")
        .take(200);
      for (const m of msgs) {
        if (m.deleted) continue;
        if (m.expiresAt && m.expiresAt <= Date.now()) continue;
        if (!m.content?.toLowerCase().includes(q)) continue;
        results.push({
          conversationId: cid,
          messageId: m._id,
          content: m.content,
          senderId: m.senderId,
          createdAt: m.createdAt,
        });
        if (results.length >= limit) return results;
      }
    }

    return results.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

// Conversation-level stats
export const getConversationStats = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation_createdAt", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    const visible = msgs.filter((m) => !m.deleted && (m.expiresAt ? m.expiresAt > Date.now() : true));
    const media = visible.filter((m) => !!m.mediaUrl);
    return {
      totalMessages: visible.length,
      mediaMessages: media.length,
      images: media.filter((m) => m.mediaType === "image").length,
      videos: media.filter((m) => m.mediaType === "video").length,
      audios: media.filter((m) => m.mediaType === "audio").length,
      files: media.filter((m) => m.mediaType === "file").length,
      firstMessageAt: visible[0]?.createdAt ?? null,
      lastMessageAt: visible[visible.length - 1]?.createdAt ?? null,
    };
  },
});
