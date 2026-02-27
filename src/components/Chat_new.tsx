"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn, formatMessageTime } from "@/lib/utils";
import { firebaseStorage } from "@/lib/firebase";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Smile,
  Trash2,
  Copy,
  Reply,
  Forward,
  Check,
  CheckCheck,
  Paperclip,
  Phone,
  Video,
  Users,
  ChevronDown,
  Mic,
  Camera,
  Search,
  Star,
  Image,
  MapPin,
  Contact,
  FileText,
  MicOff,
  X,
  Edit3,
  Sticker,
  Palette,
  Bell,
  BellOff,
  Lock,
  Info,
  Image as ImageIcon2,
  Circle,
  Pin,
  PinOff,
  MessageSquare,
  Save,
  Clock,
  Eye,
  Archive,
} from "lucide-react";

interface Message {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  senderId: string;
  content: string;
  deleted: boolean;
  reactions?: any;
  status?: string;
  replyTo?: Id<"messages">;
  mediaType?: string;
  mediaUrl?: string;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  pinnedAt?: number;
}

interface ChatProps {
  conversationId: string;
  onBack?: () => void;
  isMobile?: boolean;
}

interface QuickReply {
  _id: Id<"quickReplies">;
  title: string;
  content: string;
  createdAt: number;
}

export function Chat({ conversationId, onBack, isMobile }: ChatProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [currentBackground, setCurrentBackground] = useState("default");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isEditing, setIsEditing] = useState<Message | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [viewOnceEnabled, setViewOnceEnabled] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMuteMenu, setShowMuteMenu] = useState(false);

  const searchResults = useQuery(api.messages.searchMessages, {
    conversationId: conversationId as Id<"conversations">,
    searchQuery: searchQuery,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    setDarkMode(isDark);
    try {
      const saved = localStorage.getItem(`quickchat:wallpaper:${conversationId}`);
      if (saved) setCurrentBackground(saved);
    } catch {}
  }, []);

  const conversation = useQuery(api.conversations.getConversation, {
    conversationId: conversationId as Id<"conversations">,
  });

  const messages = useQuery(api.messages.getMessages, {
    conversationId: conversationId as Id<"conversations">,
  });

  const pinnedMessages = useQuery(api.messages.getPinnedMessages, {
    conversationId: conversationId as Id<"conversations">,
  });

  const draft = useQuery(api.messages.getDraft, {
    conversationId: conversationId as Id<"conversations">,
    userId: user?.id || "",
  });

  const quickReplies = useQuery(api.quickReplies.getQuickReplies, {
    userId: user?.id || "",
  });

  const members = useQuery(api.conversations.getConversationMembers, {
    conversationId: conversationId as Id<"conversations">,
  });
  const myMember = useMemo(
    () => members?.find((m: any) => m?.userId === user?.id)?.memberInfo,
    [members, user?.id]
  );
  const isMuted = useMemo(() => {
    const until = myMember?.muteUntil || 0;
    return typeof until === "number" && until > Date.now();
  }, [myMember]);
  const isArchived = useMemo(() => {
    return !!myMember?.isArchived;
  }, [myMember]);

  const typingStatus = useQuery(api.typing.getTypingStatus, {
    conversationId: conversationId as Id<"conversations">,
    excludeUserId: user?.id || "",
  });

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const reactToMessage = useMutation(api.messages.reactToMessage);
  const markAsRead = useMutation(api.conversations.markConversationAsRead);
  const setTypingStatus = useMutation(api.typing.setTypingStatus);
  const pinMessage = useMutation(api.messages.pinMessage);
  const saveDraft = useMutation(api.messages.saveDraft);
  const deleteDraft = useMutation(api.messages.deleteDraft);
  const starMessageMutation = useMutation(api.messages.starMessage);
  const unstarMessageMutation = useMutation(api.messages.unstarMessage);
  const setConversationMuted = useMutation(api.conversations.setConversationMuted);
  const setDisappearingMessages = useMutation(api.conversations.setDisappearingMessages);
  const setConversationArchived = useMutation(api.conversations.setConversationArchived);

  const starred = useQuery(api.messages.getStarredMessages, {
    userId: user?.id || "",
  });
  const starredIds = useMemo(
    () => new Set((starred || []).map((s: any) => s.message._id)),
    [starred]
  );
  const stats = useQuery(api.messages.getConversationStats, {
    conversationId: conversationId as Id<"conversations">,
  });

  const otherUser = members?.find((m) => m?.userId !== user?.id);

  // Load draft when conversation changes
  useEffect(() => {
    if (draft && !message) {
      setMessage(draft.content);
    }
  }, [draft, message]);

  // Save draft when message changes
  useEffect(() => {
    if (message.trim() && user?.id) {
      const userId = user.id;
      const timeoutId = setTimeout(() => {
        saveDraft({
          conversationId: conversationId as Id<"conversations">,
          userId,
          content: message,
        });
      }, 1000); // Save after 1 second of inactivity

      return () => clearTimeout(timeoutId);
    } else if (!message.trim() && draft && user?.id) {
      const userId = user.id;
      deleteDraft({
        conversationId: conversationId as Id<"conversations">,
        userId,
      });
    }
  }, [message, conversationId, user?.id, saveDraft, deleteDraft, draft]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);
  }, []);

  useEffect(() => {
    if (isAtBottom && messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages, isAtBottom]);

  useEffect(() => {
    if (conversationId && user?.id) {
      markAsRead({ conversationId: conversationId as Id<"conversations">, userId: user.id });
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    const handleClick = () => setShowContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSendMessage = async (content?: string, mediaUrl?: string, mediaType?: string, forwardReplyTo?: Id<"messages">) => {
    const messageContent = content || message.trim();
    if ((!messageContent && !mediaUrl) || !user?.id) return;

    try {
      await sendMessage({
        conversationId: conversationId as Id<"conversations">,
        senderId: user.id,
        content: messageContent || "",
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        replyTo: forwardReplyTo || replyTo?._id,
        viewOnce: viewOnceEnabled || undefined,
      });

      // Clear draft after sending
      if (draft) {
        await deleteDraft({
          conversationId: conversationId as Id<"conversations">,
          userId: user.id,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setMessage("");
    setReplyTo(null);
    setIsEditing(null);
    setViewOnceEnabled(false);
    inputRef.current?.focus();

    await setTypingStatus({
      conversationId: conversationId as Id<"conversations">,
      userId: user.id,
      isTyping: false,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = async (value: string) => {
    setMessage(value);
    if (user?.id) {
      await setTypingStatus({
        conversationId: conversationId as Id<"conversations">,
        userId: user.id,
        isTyping: value.length > 0,
      });
    }
  };

  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    await deleteMessage({ messageId });
    setShowContextMenu(null);
  };

  const handleReaction = async (messageId: Id<"messages">, emoji: string) => {
    if (!user?.id) return;
    await reactToMessage({ messageId, emoji, userId: user.id });
    setShowEmojiPicker(null);
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setShowContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    setShowContextMenu(null);
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setShowContextMenu(null);
    inputRef.current?.focus();
  };

  const handleForward = (msg: Message) => {
    setShowContextMenu(null);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
      };
      recorder.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        if (user?.id) {
          const path = `uploads/${user.id}/${file.name}`;
          const url = await firebaseStorage.uploadFile(file, path);
          if (url) {
            await handleSendMessage("", url, "audio");
          }
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (e) {
      console.error("Audio record error", e);
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
  };

  const handlePickCamera = () => {
    cameraInputRef.current?.click();
  };
  const handlePickGallery = () => {
    imageInputRef.current?.click();
  };
  const handlePickDocument = () => {
    fileInputRef.current?.click();
  };
  const handleImageSelected = async (file?: File) => {
    try {
      const f = file || imageInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0];
      if (!f || !user?.id) return;
      const path = `uploads/${user.id}/${Date.now()}_${f.name}`;
      const url = await firebaseStorage.uploadImage(f, path);
      if (url) {
        await handleSendMessage("", url, "image");
      }
    } catch (e) {
      console.error("Image upload failed", e);
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };
  const handleFileSelected = async () => {
    try {
      const f = fileInputRef.current?.files?.[0];
      if (!f || !user?.id) return;
      const path = `uploads/${user.id}/${Date.now()}_${f.name}`;
      const url = await firebaseStorage.uploadFile(f, path);
      if (url) {
        await handleSendMessage(`[File: ${f.name}]`, url, "file");
      }
    } catch (e) {
      console.error("File upload failed", e);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleShareLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://maps.google.com/?q=${latitude},${longitude}`;
        handleSendMessage(`[Location] ${latitude.toFixed(5)}, ${longitude.toFixed(5)} ${link}`);
      },
      (err) => console.warn("Geolocation error", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const handleSendContact = async () => {
    const parts = [
      contactName ? `Name: ${contactName}` : null,
      contactPhone ? `Phone: ${contactPhone}` : null,
      contactEmail ? `Email: ${contactEmail}` : null,
    ].filter(Boolean);
    if (parts.length === 0) return;
    await handleSendMessage(`[Contact] ${parts.join(", ")}`);
    setShowContactModal(false);
    setContactName(""); setContactPhone(""); setContactEmail("");
  };

  const handleStar = async (msg: Message) => {
    if (!user?.id) return;
    try {
      if (starredIds.has(msg._id)) {
        await unstarMessageMutation({ userId: user.id, messageId: msg._id });
      } else {
        await starMessageMutation({ userId: user.id, messageId: msg._id });
      }
    } catch (error) {
      console.error("Error toggling star:", error);
    }
    setShowContextMenu(null);
  };

  const handlePin = async (msg: Message) => {
    if (!user?.id) return;
    const currentlyPinned = !!msg.pinned;
    await pinMessage({ messageId: msg._id, pinned: !currentlyPinned });
    setShowContextMenu(null);
  };

  const toggleMute = async () => {
    if (!user?.id) return;
    const now = Date.now();
    const muteUntil = isMuted ? 0 : now + 8 * 60 * 60 * 1000;
    try {
      await setConversationMuted({
        conversationId: conversationId as Id<"conversations">,
        userId: user.id,
        muteUntil,
      });
    } catch (e) {
      console.error("Failed to toggle mute", e);
    }
  };

  const applyTimer = async (seconds: number) => {
    if (!user?.id) return;
    try {
      await setDisappearingMessages({
        conversationId: conversationId as Id<"conversations">,
        userId: user.id,
        disappearingSeconds: seconds,
      });
    } catch (e) {
      console.error("Failed to set timer", e);
    } finally {
      setShowTimerMenu(false);
    }
  };
  const applyMuteDuration = async (duration: "off" | "8h" | "1w" | "always") => {
    if (!user?.id) return;
    const now = Date.now();
    let muteUntil = 0;
    if (duration === "8h") muteUntil = now + 8 * 60 * 60 * 1000;
    if (duration === "1w") muteUntil = now + 7 * 24 * 60 * 60 * 1000;
    if (duration === "always") muteUntil = now + 3650 * 24 * 60 * 60 * 1000;
    try {
      await setConversationMuted({
        conversationId: conversationId as Id<"conversations">,
        userId: user.id,
        muteUntil,
      });
    } finally {
      setShowMuteMenu(false);
    }
  };
  const toggleArchive = async () => {
    if (!user?.id) return;
    try {
      await setConversationArchived({
        conversationId: conversationId as Id<"conversations">,
        userId: user.id,
        isArchived: !isArchived,
      });
    } catch (e) {
      console.error("Failed to toggle archive", e);
    }
  };

  const handleEdit = (msg: Message) => {
    setIsEditing(msg);
    setMessage(msg.content);
    setShowContextMenu(null);
    inputRef.current?.focus();
  };

  const handleQuickReply = (reply: QuickReply) => {
    setMessage(reply.content);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  const chatBackground = (() => {
    if (currentBackground === "paper") return darkMode ? '#0d1417' : 'linear-gradient(to bottom, #ECE5DD 0%, #DAD0C3 100%)';
    if (currentBackground === "green") return 'linear-gradient(180deg, #015C4B 0%, #0B141A 100%)';
    if (currentBackground === "gradient") return 'linear-gradient(135deg, #2A2F4F 0%, #41295a 100%)';
    return darkMode ? '#0d1417' : 'linear-gradient(to bottom, #E5DDD5 0%, #D5CFC7 100%)';
  })();

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: chatBackground }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse" style={{ background: darkMode ? '#313131' : '#ddd' }}></div>
          <div className="w-32 h-4 mx-auto mb-2 rounded animate-pulse" style={{ background: darkMode ? '#313131' : '#ddd' }}></div>
          <div className="w-24 h-3 mx-auto rounded animate-pulse" style={{ background: darkMode ? '#313131' : '#ddd' }}></div>
        </div>
      </div>
    );
  }

  const messageGroups = messages ? groupMessagesByDate(messages) : [];

  return (
    <div className="flex flex-col h-full relative" style={{ background: chatBackground }}>
      {/* WhatsApp-style Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: darkMode ? '#1f2937' : '#075e54', borderColor: darkMode ? '#374151' : '#128c7e' }}>
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <button onClick={onBack} className="p-2 hover:bg-black/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
              {conversation.type === "group" ? (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : otherUser?.image ? (
                <img src={otherUser.image} alt={otherUser.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-400 flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {otherUser?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            {conversation.type === "direct" && otherUser?.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white text-base truncate">
              {conversation.type === "group"
                ? conversation.name
                : otherUser?.name || "Unknown"}
            </h2>
            <p className="text-xs text-white/70">
              {conversation.type === "group" ? (
                <>{conversation.members?.length || 0} participants</>
              ) : (
                <>
                  {otherUser?.isOnline ? "online" : "last seen recently"}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions - WhatsApp style */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(!showSearch)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <Search className="w-5 h-5 text-white" />
          </button>
          <div className="relative">
            <button onClick={() => setShowHeaderMenu(!showHeaderMenu)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            {showHeaderMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg overflow-hidden shadow-lg z-50" style={{ background: darkMode ? '#2d3748' : '#ffffff' }}>
                <button onClick={() => setShowUserDetails(true)} className="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3">
                  <Info className="w-5 h-5" style={{ color: darkMode ? '#e2e8f0' : '#4a5568' }} />
                  <span style={{ color: darkMode ? '#e2e8f0' : '#2d3748' }}>Contact info</span>
                </button>
                <button onClick={() => setShowStats(true)} className="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3">
                  <Info className="w-5 h-5" style={{ color: darkMode ? '#e2e8f0' : '#4a5568' }} />
                  <span style={{ color: darkMode ? '#e2e8f0' : '#2d3748' }}>Chat stats</span>
                </button>
                <button onClick={toggleMute} className="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3">
                  {isMuted ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  <span style={{ color: darkMode ? '#e2e8f0' : '#2d3748' }}>{isMuted ? "Unmute notifications" : "Mute notifications"}</span>
                </button>
                <button onClick={toggleArchive} className="w-full text-left px-4 py-3 hover:bg-black/5 flex items-center gap-3">
                  <Archive className="w-5 h-5" style={{ color: darkMode ? '#e2e8f0' : '#4a5568' }} />
                  <span style={{ color: darkMode ? '#e2e8f0' : '#2d3748' }}>{isArchived ? "Unarchive chat" : "Archive chat"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages && pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowPinnedMessages(true)}
              className="ml-auto text-sm text-yellow-600 hover:text-yellow-500"
            >
              View all
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {messageGroups.length > 0 ? (
          messageGroups.map((group, groupIndex) => (
            <div key={group.date}>
              <div className="flex justify-center my-4">
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: darkMode
                      ? 'linear-gradient(135deg, #2a3942 0%, #1a252a 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                    color: darkMode ? '#d1d7db' : '#667',
                    boxShadow: darkMode
                      ? '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                      : '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
                    border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  {formatDateSeparator(group.date)}
                </span>
              </div>

              {group.messages.map((msg, index) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  isNew={index === group.messages.length - 1}
                  senderName={msg.senderId === user?.id ? "You" : otherUser?.name || "Unknown"}
                  onDelete={() => handleDeleteMessage(msg._id)}
                  onReaction={(emoji) => handleReaction(msg._id, emoji)}
                  onContextMenu={(e) => handleContextMenu(e, msg._id)}
                  onCopy={() => copyMessage(msg.content)}
                  onReply={() => handleReply(msg)}
                  onForward={() => handleForward(msg)}
                  onStar={() => handleStar(msg)}
                  onEdit={() => handleEdit(msg)}
                  onPin={() => handlePin(msg)}
                  isStarred={starredIds.has(msg._id)}
                  showEmojiPicker={showEmojiPicker === msg._id}
                  setShowEmojiPicker={setShowEmojiPicker}
                  darkMode={darkMode}
                />
              ))}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: darkMode ? '#313131' : 'rgba(0,0,0,0.05)' }}
            >
              <span className="text-3xl">👋</span>
            </div>
            <p className="font-medium text-lg" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
              Start a conversation
            </p>
            <p className="text-sm mt-1" style={{ color: darkMode ? '#888' : '#667' }}>
              Send a message to get started!
            </p>
          </div>
        )}

        {typingStatus && typingStatus.length > 0 && (
          <div className="flex items-center gap-2 mt-2 ml-2">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="text-xs" style={{ color: darkMode ? '#d1d7db' : '#667' }}>
              {typingStatus.length === 1
                ? `${otherUser?.name || "Someone"} is typing...`
                : "Several people are typing..."}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <button
        onClick={scrollToBottom}
        className={cn(
          "absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-2 rounded-full shadow-lg transition-all",
          showScrollButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        style={{ background: darkMode ? '#00a884' : '#00a884', color: 'white' }}
      >
        <ChevronDown className="w-4 h-4" />
        <span className="text-sm">New messages</span>
      </button>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 flex items-center gap-2" style={{ background: darkMode ? '#1e2428' : '#f0f0f0' }}>
          <div className="w-1 h-10 rounded-full" style={{ background: 'linear-gradient(180deg, #8B5CF6 0%, #EC4899 100%)' }}></div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: '#8B5CF6' }}>Replying to {replyTo.senderId === user?.id ? 'yourself' : otherUser?.name}</p>
            <p className="text-sm truncate" style={{ color: darkMode ? '#d1d7db' : '#667' }}>{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-4 h-4" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-2" style={{ background: darkMode ? '#131c21' : '#f0f2f5' }}>
        <div className="flex items-end gap-1">
          {/* Quick Replies Button */}
          <div className="relative">
            <button
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
            >
              <MessageSquare className="w-5 h-5" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
            </button>
          </div>

          {/* Message Input */}
          <div className="flex-1 rounded-2xl px-3" style={{ background: darkMode ? '#262d31' : '#ffffff' }}>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full py-2.5 bg-transparent text-sm focus:outline-none"
              style={{ color: darkMode ? '#d1d7db' : '#333' }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
              title="Attach"
            >
              <Paperclip className="w-5 h-5" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
            </button>
            {showFileMenu && (
              <div className="absolute bottom-12 right-0 w-56 rounded-2xl bg-white/95 backdrop-blur text-sm overflow-hidden shadow-xl p-2">
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handlePickCamera} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-black/5">
                    <Camera className="w-5 h-5" />
                    <span>Camera</span>
                  </button>
                  <button onClick={handlePickGallery} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-black/5">
                    <Image className="w-5 h-5" />
                    <span>Gallery</span>
                  </button>
                  <button onClick={handlePickDocument} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-black/5">
                    <FileText className="w-5 h-5" />
                    <span>Document</span>
                  </button>
                  <button onClick={() => setShowContactModal(true)} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-black/5">
                    <Contact className="w-5 h-5" />
                    <span>Contact</span>
                  </button>
                  <button onClick={handleShareLocation} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-black/5">
                    <MapPin className="w-5 h-5" />
                    <span>Location</span>
                  </button>
                  <button onClick={() => setShowFileMenu(false)} className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-black/5">
                    <X className="w-5 h-5" />
                    <span>Close</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isRecording ? (
            <button
              onClick={startRecording}
              className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
              title="Record voice"
            >
              <Mic className="w-5 h-5" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: darkMode ? '#2a3942' : '#eaeaea' }}>
              <span className="recording-dot" />
              <div className="voice-waveform" style={{ color: darkMode ? '#8B5CF6' : '#8B5CF6' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className="voice-bar" style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
              </span>
              <button onClick={stopRecording} className="p-1.5 rounded-full hover:bg-red-500/20" title="Stop">
                <MicOff className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}

          <button
            onClick={() => setViewOnceEnabled(!viewOnceEnabled)}
            className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
            title="View once"
          >
            <Eye className="w-5 h-5" style={{ color: viewOnceEnabled ? '#eab308' : (darkMode ? '#d1d7db' : '#667') }} />
          </button>
          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <Send className="w-5 h-5 text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', borderRadius: '50%', padding: '4px' }} />
          </button>
        </div>
        <input ref={cameraInputRef} onChange={() => handleImageSelected()} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} />
        <input ref={imageInputRef} onChange={() => handleImageSelected()} type="file" accept="image/*" style={{ display: 'none' }} />
        <input ref={fileInputRef} onChange={handleFileSelected} type="file" style={{ display: 'none' }} />

        {/* Quick Replies Panel */}
        {showQuickReplies && quickReplies && quickReplies.length > 0 && (
          <div className="mt-2 p-2 rounded-xl" style={{ background: darkMode ? '#262d31' : '#f0f0f0' }}>
            <div className="flex gap-2 overflow-x-auto">
              {quickReplies.map((reply) => (
                <button
                  key={reply._id}
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-white/10 transition-colors"
                  style={{ background: darkMode ? '#313131' : '#ffffff', color: darkMode ? '#d1d7db' : '#333' }}
                >
                  {reply.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pinned Messages Modal */}
      {showPinnedMessages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md mx-4 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Pinned Messages</h3>
                <button onClick={() => setShowPinnedMessages(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pinnedMessages?.map((msg) => (
                  <div key={msg._id} className="p-3 rounded-xl bg-white/5">
                    <p className="text-white text-sm">{msg.content}</p>
                    <p className="text-white/60 text-xs mt-1">{formatMessageTime(msg.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">Share Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="space-y-2">
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 rounded-md bg-white/10 text-white outline-none" />
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 rounded-md bg-white/10 text-white outline-none" />
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded-md bg-white/10 text-white outline-none" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowContactModal(false)} className="px-3 py-2 rounded-md bg-white/10 text-white">Cancel</button>
              <button onClick={handleSendContact} className="px-3 py-2 rounded-md" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', color: '#fff' }}>
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md mx-4 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white">Chat statistics</h3>
                <button onClick={() => setShowStats(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-white text-sm">
                <div className="rounded-xl p-3 bg-white/5">
                  <p className="text-white/60">Messages</p>
                  <p className="text-lg font-bold">{stats?.totalMessages ?? 0}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5">
                  <p className="text-white/60">Media</p>
                  <p className="text-lg font-bold">{stats?.mediaMessages ?? 0}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5">
                  <p className="text-white/60">Images</p>
                  <p className="text-lg font-bold">{stats?.images ?? 0}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5">
                  <p className="text-white/60">Videos</p>
                  <p className="text-lg font-bold">{stats?.videos ?? 0}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5">
                  <p className="text-white/60">Audio</p>
                  <p className="text-lg font-bold">{stats?.audios ?? 0}</p>
                </div>
                <div className="rounded-xl p-3 bg-white/5">
                  <p className="text-white/60">Files</p>
                  <p className="text-lg font-bold">{stats?.files ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  let currentDate = "";

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ date: currentDate, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });

  return groups;
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
  });
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isNew?: boolean;
  senderName: string;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCopy: () => void;
  onReply: () => void;
  onForward: () => void;
  onStar: () => void;
  onEdit: () => void;
  onPin: () => void;
  isStarred: boolean;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (id: string | null) => void;
  darkMode?: boolean;
}

function MessageBubble({
  message,
  isOwn,
  senderName,
  onDelete,
  onReaction,
  onContextMenu,
  onCopy,
  onReply,
  onForward,
  onStar,
  onEdit,
  onPin,
  isStarred,
  showEmojiPicker,
  setShowEmojiPicker,
  darkMode,
}: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const content = message.content || "";
  const needsCollapse =
    content.length > 240 || (content.match(/\n/g)?.length || 0) > 6;
  const displayText =
    needsCollapse && !expanded
      ? content.slice(0, 240) + (content.length > 240 ? "…" : "")
      : content;
  // Normalize reactions from any stored shape into [{ emoji, userIds }]
  const normalizedReactions: { emoji: string; userIds: string[] }[] = (() => {
    const raw = message.reactions;
    if (!raw) return [];

    if (Array.isArray(raw)) {
      if (raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "emoji" in raw[0]) {
        return raw as { emoji: string; userIds: string[] }[];
      }
      return [];
    }

    if (typeof raw === "object" && raw !== null) {
      return Object.entries(raw as Record<string, string[]>).map(([emoji, users]) => ({
        emoji,
        userIds: Array.isArray(users) ? users : [],
      }));
    }

    return [];
  })();

  if (message.deleted) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <div
          className="max-w-[75%] px-4 py-2 rounded-2xl"
          style={{ background: darkMode ? '#2a3942' : 'rgba(0,0,0,0.05)' }}
        >
          <p className="text-sm italic" style={{ color: darkMode ? '#888' : '#999' }}>
            <Reply className="w-3 h-3 inline mr-1" />
            This message was deleted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full group",
        isOwn ? "justify-end" : "justify-start"
      )}
      onContextMenu={onContextMenu}
    >
      <div
        className={cn(
          "max-w-[70%] sm:max-w-[65%] md:max-w-[60%] px-3 py-2 rounded-2xl relative cursor-pointer shadow-sm",
          isOwn
            ? "rounded-br-sm sm:rounded-br-md"
            : "rounded-bl-sm sm:rounded-bl-md"
        )}
        style={{
          background: isOwn
            ? (darkMode ? '#005c4b' : '#dcf8c6')
            : (darkMode ? '#262d31' : '#ffffff'),
          border: darkMode ? 'none' : '1px solid #e0e0e0',
          marginLeft: isOwn ? "auto" : undefined,
          marginRight: isOwn ? undefined : "auto",
        }}
      >
        {/* Pin indicator */}
        {message.pinned && (
          <div className="flex items-center gap-1 mb-1">
            <Pin className="w-3 h-3 text-yellow-500" />
            <span className="text-xs text-yellow-500">Pinned</span>
          </div>
        )}

        {!isOwn && (
          <p
            className="text-xs font-semibold mb-0.5"
            style={{ color: darkMode ? '#8B5CF6' : '#00a884' }}
          >
            {senderName}
          </p>
        )}

        {/* Media rendering */}
        {message.mediaUrl && message.mediaType === "image" && (
          <img
            src={message.mediaUrl}
            alt="Image"
            loading="lazy"
            className="max-w-full rounded-lg mb-1"
          />
        )}
        {message.mediaUrl && message.mediaType === "audio" && (
          <audio src={message.mediaUrl} controls className="w-full my-1" />
        )}
        {message.mediaUrl && message.mediaType === "file" && (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="text-sm underline block my-1">
            Download file
          </a>
        )}

        <div className="text-sm whitespace-pre-wrap break-words" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
          {displayText}
          {needsCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="ml-1 text-xs underline"
              style={{ color: darkMode ? '#8B5CF6' : '#00a884' }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        <div className={cn("flex items-center justify-end gap-1 mt-0.5")}>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md"
            style={{
              color: darkMode ? '#888' : '#667',
              background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              boxShadow: isOwn ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
            }}
          >
            {formatMessageTime(message.createdAt)}
          </span>
          {isStarred && <Star className="w-3 h-3 text-yellow-400" />}
        </div>

        {normalizedReactions.length > 0 && (
          <div
            className="absolute -bottom-2 right-2 flex gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: darkMode ? '#2a3942' : '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            {normalizedReactions.map(({ emoji, userIds }) => (
              <span
                key={emoji}
                className="text-xs flex items-center gap-0.5"
              >
                <span>{emoji}</span>
                {userIds.length > 1 && (
                  <span className="text-[10px]" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
                    {userIds.length}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            "absolute top-0 -translate-y-full flex gap-0.5 p-1 rounded-full shadow-md",
            isOwn ? "right-0" : "left-0",
            "opacity-0 group-hover:opacity-100 transition-opacity z-10"
          )}
          style={{ background: darkMode ? '#313131' : '#fff' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(showEmojiPicker ? null : message._id);
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Smile className="w-4 h-4" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Reply className="w-4 h-4" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStar();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            title={isStarred ? "Unstar" : "Star"}
          >
            <Star className="w-4 h-4" style={{ color: isStarred ? '#eab308' : (darkMode ? '#d1d7db' : '#667') }} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Pin className="w-4 h-4" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
          </button>
          {isOwn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>

        {showEmojiPicker && (
          <div
            className={cn(
              "absolute flex gap-1 p-1.5 rounded-full shadow-lg top-0 -translate-y-full z-20",
              isOwn ? "right-0" : "left-0"
            )}
            style={{ background: darkMode ? '#313131' : '#fff' }}
          >
            {["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "😍"].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(emoji);
                }}
                className="p-1 hover:bg-gray-100 rounded-full text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
