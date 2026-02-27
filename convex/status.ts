import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Get all status updates (for contacts)
export const getContactsStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all users except the current user
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("userId"), args.userId))
      .collect();

    // Get status for each user
    const now = Date.now();
    const statuses = await Promise.all(
      allUsers.map(async (user) => {
        const userStatus = await ctx.db
          .query("status")
          .filter((q) => 
            q.and(
              q.eq(q.field("userId"), user.userId),
              q.gt(q.field("expiresAt"), now)
            )
          )
          .collect();
        return {
          user,
          status: userStatus,
        };
      })
    );

    // Filter out users with no status
    return statuses.filter((s) => s.status.length > 0);
  },
});

// Get user's own status
export const getMyStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("status")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.gt(q.field("expiresAt"), now)
        )
      )
      .collect();
  },
});

// Create a status update
export const createStatus = mutation({
  args: {
    userId: v.string(),
    content: v.string(),
    mediaType: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"status">> => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    const statusId = await ctx.db.insert("status", {
      userId: args.userId,
      content: args.content,
      mediaType: args.mediaType,
      mediaUrl: args.mediaUrl,
      views: [],
      createdAt: Date.now(),
      expiresAt,
    });

    return statusId;
  },
});

// View a status (mark as viewed)
export const viewStatus = mutation({
  args: {
    statusId: v.id("status"),
    viewerId: v.string(),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db.get(args.statusId);
    if (status && !status.views.includes(args.viewerId)) {
      await ctx.db.patch(args.statusId, {
        views: [...status.views, args.viewerId],
      });
    }
  },
});

// Delete a status
export const deleteStatus = mutation({
  args: { statusId: v.id("status") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.statusId);
  },
});

// Reply to a status
export const replyToStatus = mutation({
  args: {
    statusId: v.id("status"),
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"statusReplies">> => {
    return await ctx.db.insert("statusReplies", {
      statusId: args.statusId,
      userId: args.userId,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// Get status replies
export const getStatusReplies = query({
  args: { statusId: v.id("status") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("statusReplies")
      .filter((q) => q.eq(q.field("statusId"), args.statusId))
      .collect();
  },
});

// Clean up expired status (can be called periodically)
export const cleanupExpiredStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredStatus = await ctx.db
      .query("status")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const status of expiredStatus) {
      await ctx.db.delete(status._id);
    }

    return expiredStatus.length;
  },
});
