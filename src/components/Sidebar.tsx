"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { formatMessageTime } from "@/lib/utils";
import { 
  Search, 
  MoreVertical, 
  ArrowLeft,
  Settings,
  LogOut,
  Phone,
  Video,
  X,
  Pencil,
  Users,
  Sparkles,
  Radio,
  Check,
  MessageCircle,
  UserPlus,
  Sparkle,
  Hash
} from "lucide-react";

interface ConversationWithDetails {
  _id?: Id<"conversations">;
  type?: string;
  name?: string;
  members?: string[];
  createdAt?: number;
  updatedAt?: number;
  lastReadAt?: number;
  unreadCount?: number;
  labels?: string[];
  otherUser?: {
    _id: string;
    userId: string;
    name: string;
    image?: string;
    isOnline: boolean;
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: number;
  };
  admin?: string;
}

interface SidebarProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
  onBack?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  onSelectConversation,
  selectedConversationId,
  onBack,
  isMobile,
}: SidebarProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<"chats" | "users">("chats");
  const [globalSearchMode, setGlobalSearchMode] = useState(false);
  const [labelEditFor, setLabelEditFor] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
  };
  
  const syncUserToConvex = useMutation(api.users.getOrCreateUser);
  
  useEffect(() => {
    if (isLoaded && clerkUser) {
      syncUserToConvex({
        userId: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || "User",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        image: clerkUser.imageUrl,
      }).catch(console.error);
    }
  }, [isLoaded, clerkUser, syncUserToConvex]);

  const searchRef = useRef<HTMLDivElement>(null);
  
  const conversations = useQuery(api.conversations.getConversations, {
    userId: clerkUser?.id || "",
  });

  const allUsers = useQuery(api.users.getUsers, {
    currentUserId: clerkUser?.id || "",
  });
  const globalResults = useQuery(api.messages.globalSearch, {
    userId: clerkUser?.id || "",
    searchQuery: searchQuery,
  });

  const searchUsers = searchQuery.length > 0 && allUsers
    ? allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allUsers?.filter(u => u.userId !== clerkUser?.id) || [];

  const createConversation = useMutation(
    api.conversations.getOrCreateDirectConversation
  );

  const createGroup = useMutation(
    api.conversations.createGroupConversation
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0 || !clerkUser?.id) return;
    
    const members = [...selectedMembers, clerkUser.id];
    const conversationId = await createGroup({
      name: groupName.trim(),
      members,
      admin: clerkUser.id,
    });
    
    onSelectConversation(conversationId);
    setShowNewChat(false);
    setShowGroupCreate(false);
    setGroupName("");
    setSelectedMembers([]);
    setSearchQuery("");
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSelectUser = async (otherUserId: string) => {
    if (!clerkUser?.id) return;
    const conversationId = await createConversation({
      userId1: clerkUser.id,
      userId2: otherUserId,
    });
    onSelectConversation(conversationId);
    setShowNewChat(false);
    setSearchQuery("");
  };

  if (!isLoaded || !clerkUser) {
    return (
      <div className="flex items-center justify-center h-full gradient-animate">
        <div className="w-12 h-12 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show group creation panel
  if (showGroupCreate) {
    return (
      <div className="flex flex-col h-full" style={{ background: darkMode ? '#0F0F1A' : '#F8FAFC' }}>
        <div className="flex items-center gap-3 p-4 gradient-animate">
          <button onClick={() => setShowGroupCreate(false)} className="p-2 hover:bg-white/10 rounded-full">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white font-bold">Create Group</span>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm"
            style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9', color: darkMode ? 'white' : '#333' }}
          />
        </div>
        
        <div className="px-4 pb-2">
          <p className="text-sm text-white/70">Add participants ({selectedMembers.length} selected)</p>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {allUsers && allUsers.length > 0 ? (
            allUsers.filter(u => u.userId !== clerkUser.id).map((u) => (
              <button
                key={u._id}
                onClick={() => toggleMemberSelection(u.userId)}
                className="flex items-center gap-4 w-full px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
                      <span className="text-lg font-bold text-white">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-white">{u.name}</p>
                </div>
                {selectedMembers.includes(u.userId) && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <p className="text-white">No contacts available</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0}
            className="w-full py-3 rounded-2xl font-bold text-white btn-gradient disabled:opacity-50"
            style={{ background: groupName.trim() && selectedMembers.length > 0 ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' : 'gray' }}
          >
            Create Group ({selectedMembers.length + 1})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: darkMode ? '#0F0F1A' : '#F8FAFC' }}>
      {/* WhatsApp-style Header */}
      <div className="flex flex-col" style={{ background: darkMode ? '#075e54' : '#075e54' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {isMobile && onBack && (
              <button onClick={onBack} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="relative w-10 h-10 rounded-full overflow-hidden hover:opacity-80 transition-opacity"
            >
              {clerkUser.imageUrl ? (
                <img src={clerkUser.imageUrl} alt={clerkUser.fullName || "User"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {clerkUser.firstName?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </button>
            <div>
              <h1 className="text-white font-semibold text-lg">QuickChat</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => { setShowNewChat(true); setSelectedTab("users"); }} className="p-2 hover:bg-black/10 rounded-full transition-colors">
              <MessageCircle className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 hover:bg-black/10 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)' }}>
              <Search className="w-4 h-4 text-white/70" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    setGlobalSearchMode(true);
                  } else {
                    setGlobalSearchMode(false);
                  }
                }}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/50 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-white/10 rounded-full">
                  <X className="w-4 h-4 text-white/70" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {globalSearchMode && searchQuery && (
        <div className="p-3 border-b border-white/10">
          <p className="text-xs mb-2" style={{ color: darkMode ? '#A0AEC0' : '#64748B' }}>Results</p>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(globalResults || []).map((r) => (
              <button
                key={`${r.conversationId}-${r.messageId}`}
                onClick={() => onSelectConversation(r.conversationId)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5"
              >
                <p className="text-xs text-white/60">{new Date(r.createdAt).toLocaleString()}</p>
                <p className="text-sm text-white/90 truncate">{r.content}</p>
              </button>
            ))}
            {(!globalResults || globalResults.length === 0) && (
              <p className="text-sm" style={{ color: darkMode ? '#6B7280' : '#9CA3AF' }}>No results</p>
            )}
          </div>
        </div>
      )}

      {/* New Chat Panel */}
      {showNewChat && (
        <div className="absolute inset-0 z-50 flex flex-col" style={{ background: darkMode ? '#0F0F1A' : '#F8FAFC' }}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 gradient-animate">
            <button onClick={() => { setShowNewChat(false); setSearchQuery(""); }} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-bold">New Chat</span>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-2xl text-sm"
                style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9', color: darkMode ? 'white' : '#333', border: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.1)' : '#E2E8F0') }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 px-4 pb-4">
              <button 
                onClick={() => setShowGroupCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold btn-micro hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', color: 'white', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              >
                <Users className="w-4 h-4" />
                New Group
              </button>
              <button 
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold btn-micro hover:scale-105 transition-transform"
                style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : '#F1F5F9', color: darkMode ? 'white' : '#333' }}
              >
                <Radio className="w-4 h-4" />
                Broadcast
              </button>
          </div>

          {/* Section Title */}
          <div className="px-4 pb-2">
            <p className="text-sm font-semibold" style={{ color: darkMode ? '#A0AEC0' : '#64748B' }}>
              {searchQuery ? `Search results for "${searchQuery}"` : 'Select a contact'}
            </p>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100% - 220px)' }}>
            {searchUsers && searchUsers.length > 0 ? (
              <div className="p-2">
                {searchUsers.map((u, index) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectUser(u.userId)}
                    className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl card-micro hover:bg-white/5 transition-all duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Avatar with glow */}
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
                        {u.image ? (
                          <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
                            <span className="text-xl font-bold text-white">{u.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      {/* Online indicator */}
                      <span 
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
                        style={{ background: u.isOnline ? '#10B981' : '#6B7280', borderColor: darkMode ? '#0F0F1A' : '#F8FAFC' }}
                      />
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{u.name}</p>
                        {u.isOnline && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                            Online
                          </span>
                        )}
                      </div>
                      <p className="text-sm truncate" style={{ color: darkMode ? '#6B7280' : '#9CA3AF' }}>
                        {u.isOnline ? 'Active now' : 'Offline'}
                      </p>
                    </div>

                    {/* Action Icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)' }}>
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                {/* Animated icon */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.2) 100%)' }}>
                    <Search className="w-12 h-12 text-purple-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
                    <Sparkle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="font-bold text-lg text-white mb-1">
                  {searchQuery ? 'No users found' : 'No contacts yet'}
                </p>
                <p className="text-sm" style={{ color: darkMode ? '#6B7280' : '#9CA3AF' }}>
                  {searchQuery ? 'Try a different search term' : 'Invite friends to get started!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
          <div className="absolute left-3 top-16 rounded-2xl shadow-2xl z-50 w-72 py-2 glass-card">
            <div className="p-4 border-b border-white/10">
              <p className="font-bold text-white">{clerkUser.fullName}</p>
              <p className="text-sm" style={{ color: '#A0AEC0' }}>{clerkUser.emailAddresses[0]?.emailAddress}</p>
            </div>
            <button 
              onClick={toggleDarkMode}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors"
            >
              {darkMode ? (
                <>
                  <span className="text-xl">☀️</span>
                  <span className="text-white">Light Mode</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🌙</span>
                  <span className="text-white">Dark Mode</span>
                </>
              )}
            </button>
            <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors">
              <Settings className="w-5 h-5 text-white/70" />
              <span className="text-white">Settings</span>
            </button>
            <SignOutButton>
              <button className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/20 transition-colors text-red-400">
                <LogOut className="w-5 h-5" />
                <span>Log out</span>
              </button>
            </SignOutButton>
          </div>
        </>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations && conversations.length > 0 ? (
          <div className="p-2">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUserId={clerkUser?.id || ""}
                isSelected={selectedConversationId === conv._id}
                onClick={() => conv._id && onSelectConversation(conv._id)}
                darkMode={darkMode}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center glass-card">
                <Sparkles className="w-12 h-12 text-gradient" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center animate-bounce" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
                <Sparkle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="font-bold text-lg text-white">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </p>
            <p className="text-sm mt-2" style={{ color: darkMode ? '#6B7280' : '#9CA3AF' }}>
              {searchQuery ? 'Try a different search' : 'Start a new chat to get started'}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => { setShowNewChat(true); setSelectedTab("users"); }}
                className="mt-6 px-8 py-3 rounded-2xl font-bold text-white hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
              >
                Start chat ✨
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
  darkMode?: boolean;
}

function ConversationItem({ conversation, currentUserId, isSelected, onClick, darkMode }: ConversationItemProps) {
  const otherMemberId = conversation.members?.find((id) => id !== currentUserId);
  const otherUser = useQuery(api.users.getUser, { userId: otherMemberId || "" });
  const setConversationLabels = useMutation(api.conversations.setConversationLabels);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(conversation.labels?.join(", ") || "");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-200 ${isSelected ? 'glass-card' : 'hover:bg-white/5 card-hover'}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-purple-500/20">
          {conversation.type === "group" ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
              <Users className="w-6 h-6 text-white" />
            </div>
          ) : otherUser?.image ? (
            <img src={otherUser.image} alt={otherUser.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
              <span className="text-lg font-bold text-white">
                {otherUser?.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>
        {conversation.type === "direct" && otherUser?.isOnline && (
          <span 
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2"
            style={{ background: '#10B981', borderColor: darkMode ? '#0F0F1A' : '#F8FAFC' }}
          />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-white truncate">
            {conversation.type === "group" ? conversation.name : otherUser?.name || "Unknown"}
          </p>
          {conversation.updatedAt && (
            <span className="text-xs flex-shrink-0" style={{ color: conversation.unreadCount && conversation.unreadCount > 0 ? '#8B5CF6' : '#A0AEC0' }}>
              {formatMessageTime(conversation.updatedAt)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm truncate" style={{ color: '#A0AEC0' }}>
            {conversation.type === "group" 
              ? `${conversation.members?.length || 0} participants`
              : otherUser?.isOnline 
                ? 'Online' 
                : 'Tap to chat'
            }
          </p>
          {conversation.unreadCount && conversation.unreadCount > 0 && (
            <span className="badge-gradient flex-shrink-0">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
        {conversation.labels && conversation.labels.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {conversation.labels.map((l) => (
              <span key={l} className="px-2 py-0.5 rounded-lg text-[10px]" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}>{l}</span>
            ))}
          </div>
        )}
        {isSelected && (
          <div className="mt-2 flex items-center gap-1">
            {!editing ? (
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="px-2 py-1 rounded-lg text-xs flex items-center gap-1 hover:bg-white/5"
              >
                <Hash className="w-3 h-3" />
                Labels
              </button>
            ) : (
              <div className="flex items-center gap-1 w-full">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="tag1, tag2"
                  className="flex-1 bg-transparent text-xs px-2 py-1 rounded-lg"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const labels = input.split(",").map(s => s.trim()).filter(Boolean);
                    if (conversation._id) {
                      await setConversationLabels({ conversationId: conversation._id as Id<"conversations">, userId: currentUserId, labels });
                    }
                    setEditing(false);
                  }}
                  className="px-2 py-1 rounded-lg text-xs hover:bg-white/5"
                >
                  Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(false); }}
                  className="px-2 py-1 rounded-lg text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
