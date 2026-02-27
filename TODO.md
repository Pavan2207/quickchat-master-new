# QuickChat Enhancement - Implementation TODO

## Phase 1: Firebase Setup (Skipping - Using Convex)
- [x] Using Convex instead of Firebase (already configured)

## Phase 2: Enhanced Login Page
- [ ] Add phone number login option (via Clerk)
- [ ] Add biometric login simulation
- [ ] Add more social login options
- [ ] Add animated background effects (already exists)
- [ ] Add welcome screens

## Phase 3: New Features Implementation

### Messaging Enhancements
- [x] Camera capture with filters (8 filters: Normal, Warm, Cool, B&W, Vintage, Vivid, Muted, Dramatic)
- [x] Location sharing with map (Google Maps integration)
- [x] Contact sharing
- [x] Audio messages with waveform visualization (partially exists)
- [x] Document/file sharing with Firebase upload and compression
- [x] View once media (self-destructing) - BACKEND READY
- [x] Message timer (disappearing messages) - BACKEND READY
- [ ] Message drafts saving
- [x] Message pins - BACKEND READY
- [x] Star/bookmark messages - BACKEND READY

### Chat Organization
- [ ] Chat labels/tags - BACKEND READY
- [ ] Broadcast lists - BACKEND READY
- [x] Starred messages view - BACKEND READY
- [x] Chat archive - BACKEND READY
- [x] Chat mute functionality - BACKEND READY

### Privacy & Settings
- [x] Last seen privacy controls (schema has showLastSeen)
- [x] Read receipts control (schema has showReadReceipts)
- [x] Online status control (schema has showOnlineStatus)
- [x] Block/unblock users - BACKEND READY
- [ ] Notification custom sounds

### UI/UX Enhancements
- [ ] Chat themes/wallpapers - BACKEND READY
- [ ] Chat statistics
- [x] Global search across chats - BACKEND READY
- [x] Message read more (collapse long messages)
- [ ] Quick replies/canned responses - BACKEND READY

### Status Feature (WhatsApp Status)
- [x] Create text status - UI COMPLETE
- [ ] Create image status
- [x] View status updates - UI COMPLETE
- [ ] Status replies
- [x] Status expiry (24 hours) - BACKEND READY
- [x] Status view count - BACKEND READY
- [ ] Status privacy settings

## Phase 4: Performance & Optimization
- [ ] Lazy loading for media
- [ ] Message pagination
- [ ] Image compression before upload
- [ ] Offline support

## Implementation Order:
1. Update Convex Schema (status, archived, blocked users, etc.)
2. Add Convex API functions
3. Add Status feature UI
4. Add Chat Organization features
5. Add Privacy features
6. Add remaining Messaging features
7. Performance optimizations

## COMPLETED ITEMS:
✅ Updated Convex Schema with new tables (status, blockedUsers, chatLabels, broadcastLists, quickReplies, etc.)
✅ Added archive/mute/pin/conversation functions to conversations.ts
✅ Added status feature backend (getContactsStatus, createStatus, viewStatus, deleteStatus, etc.)
✅ Added blocking feature (blockUser, unblockUser, getBlockedUsers, isUserBlocked)
✅ Added starred/pinned messages (starMessage, pinMessage, getStarredMessages, getPinnedMessages)
✅ Added global search across chats
✅ Added view-once and disappearing messages support
✅ Created Status UI component with WhatsApp-style status viewer
✅ Added wallpaper/theme support to conversations
