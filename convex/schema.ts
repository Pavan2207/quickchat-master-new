import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.optional(v.number()),
    // Privacy settings
    showOnlineStatus: v.optional(v.boolean()),
    showLastSeen: v.optional(v.boolean()),
    showReadReceipts: v.optional(v.boolean()),
    allowGroupInvites: v.optional(v.boolean()),
  })
    .index("userId", ["userId"])
    .index("email", ["email"]),

  conversations: defineTable({
    type: v.string(),
    name: v.optional(v.string()),
    members: v.array(v.string()),
    admin: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Legacy per-conversation flags kept for backward compatibility
    isArchived: v.optional(v.boolean()),
    isMuted: v.optional(v.boolean()),
  })
    .index("updatedAt", ["updatedAt"])
    .index("members", ["members"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    lastReadAt: v.number(),
    unreadCount: v.number(),
    // Per-user chat settings (WhatsApp-like)
    isArchived: v.optional(v.boolean()),
    muteUntil: v.optional(v.number()), // timestamp; undefined/0 = not muted
    labels: v.optional(v.array(v.string())), // label IDs or names
    disappearingSeconds: v.optional(v.number()), // default disappearing timer for this chat
  })
    .index("conversationId", ["conversationId"])
    .index("userId", ["userId"])
    .index("by_conversation_user", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
    deleted: v.boolean(),
    reactions: v.any(),
    status: v.optional(v.string()), // "sent", "delivered", "read"
    replyTo: v.optional(v.id("messages")),
    forwardFrom: v.optional(v.id("messages")),
    mediaType: v.optional(v.string()), // "image", "video", "audio", "file"
    mediaUrl: v.optional(v.string()),
    // WhatsApp-like extras and legacy flags
    pinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
    viewOnce: v.optional(v.boolean()),
    viewedBy: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
    // Legacy fields from previous versions
    isDraft: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
    isStarred: v.optional(v.boolean()),
    isViewOnce: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("conversationId", ["conversationId"])
    .index("createdAt", ["createdAt"])
    .index("by_conversation_createdAt", ["conversationId", "createdAt"])
    .index("by_conversation_pinnedAt", ["conversationId", "pinnedAt"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("conversationId", ["conversationId"])
    .index("userId", ["userId"]),

  // WhatsApp Status
  status: defineTable({
    userId: v.string(),
    content: v.string(),
    mediaType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    views: v.array(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
    // Privacy controls (optional; defaults to "contacts")
    privacy: v.optional(v.union(v.literal("contacts"), v.literal("only"), v.literal("except"))),
    allowList: v.optional(v.array(v.string())),
    denyList: v.optional(v.array(v.string())),
  })
    .index("userId", ["userId"])
    .index("expiresAt", ["expiresAt"]),

  statusReplies: defineTable({
    statusId: v.id("status"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("statusId", ["statusId"])
    .index("by_status_createdAt", ["statusId", "createdAt"]),

  // Quick replies (canned responses)
  quickReplies: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("by_user_createdAt", ["userId", "createdAt"]),

  // Drafts per conversation per user
  messageDrafts: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    content: v.string(),
    updatedAt: v.number(),
  })
    .index("by_conversation_user", ["conversationId", "userId"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  // Starred (bookmarked) messages per user
  starredMessages: defineTable({
    userId: v.string(),
    messageId: v.id("messages"),
    conversationId: v.id("conversations"),
    starredAt: v.number(),
  })
    .index("by_user_starredAt", ["userId", "starredAt"])
    .index("by_user_message", ["userId", "messageId"]),

  // Blocking (Convex-backed; separate from Firebase demo)
  blockedUsers: defineTable({
    blockerId: v.string(),
    blockedId: v.string(),
    createdAt: v.number(),
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocker_blocked", ["blockerId", "blockedId"]),

  // Chat labels/tags
  chatLabels: defineTable({
    ownerId: v.string(),
    name: v.string(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_name", ["ownerId", "name"]),

  // Broadcast lists
  broadcastLists: defineTable({
    ownerId: v.string(),
    name: v.string(),
    memberIds: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner_updatedAt", ["ownerId", "updatedAt"]),

  // User preferences (migrated from localStorage)
  userPreferences: defineTable({
    userId: v.string(),
    notificationSound: v.optional(v.boolean()),
    wallpaper: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  // Conversation wallpapers (per conversation per user)
  conversationWallpapers: defineTable({
    userId: v.string(),
    conversationId: v.id("conversations"),
    wallpaper: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user_conversation", ["userId", "conversationId"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),
});
