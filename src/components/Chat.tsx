"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn, formatMessageTime } from "@/lib/utils";
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
} from "lucide-react";

interface Message {
  _id: Id<"messages">;
  conversationId: Id<"conversations">;
  senderId: string;
  content: string;
  deleted: boolean;
  reactions: Record<string, string[]>;
  status?: string;
  replyTo?: Id<"messages">;
  mediaType?: string;
  mediaUrl?: string;
  createdAt: number;
  updatedAt: number;
}

interface ChatProps {
  conversationId: string;
  onBack?: () => void;
  isMobile?: boolean;
}

// Extended emoji list for unlimited emoji picker
const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐"],
  "Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🙏", "🤝", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "😍", "🥰", "😘", "💋", "💌", "💒", "🏩", "👩‍❤️‍👨", "👨‍❤️‍👨", "👩‍❤️‍👩", "💑", "👫", "👭", "👬", "🧑‍🤝‍🧑", "👫", "💏", "🧑‍❤️‍🧑"],
  "Objects": ["⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎"],
  "Symbols": ["✅", "❌", "❓", "❗", "‼️", "⁉️", "💯", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "💠", "🔘", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊", "🔔", "🔕", "📣", "📢", "💬", "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴", "🀄", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛"],
  "Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏"],
  "Food": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥖", "🍞", "🥨", "🥯", "🧇", "🥞", "🧈", "🍳", "🥚", "🧀", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪"],
  "Flags": ["🏳️", "🏴", "🏴‍☠️", "🏁", "🚩", "🎌", "🏾", "🏼", "🏽", "🏿", "🏻", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘", "🦛", "🦏", "🐊", "🐅", "🐆", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇮🇳", "🇨🇳", "🇯🇵", "🇰🇷", "🇩🇪", "🇫🇷", "🇮🇹", "🇪🇸", "🇧🇷", "🇲🇽", "🇷🇺"]
};

export function Chat({ conversationId, onBack, isMobile }: ChatProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
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
  const searchResults = useQuery(api.messages.searchMessages, {
    conversationId: conversationId as Id<"conversations">,
    searchQuery: searchQuery,
  });
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isEditing, setIsEditing] = useState<Message | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Smileys");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    setDarkMode(isDark);
  }, []);

  const conversation = useQuery(api.conversations.getConversation, {
    conversationId: conversationId as Id<"conversations">,
  });

  const messages = useQuery(api.messages.getMessages, {
    conversationId: conversationId as Id<"conversations">,
  });

  const members = useQuery(api.conversations.getConversationMembers, {
    conversationId: conversationId as Id<"conversations">,
  });

  const typingStatus = useQuery(api.typing.getTypingStatus, {
    conversationId: conversationId as Id<"conversations">,
    excludeUserId: user?.id || "",
  });

  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const reactToMessage = useMutation(api.messages.reactToMessage);
  const markAsRead = useMutation(api.conversations.markConversationAsRead);
  const setTypingStatus = useMutation(api.typing.setTypingStatus);

  const otherUser = members?.find((m) => m?.userId !== user?.id);
  
  // Get the OTHER user's member info to check if they have read our messages
  const otherUserMember = members?.find((m) => m?.userId !== user?.id);
  const otherUserLastReadAt = otherUserMember?.memberInfo?.lastReadAt;

  // Helper to check if message is read by the other user
  const isMessageRead = (messageCreatedAt: number) => {
    if (!otherUserLastReadAt) return false;
    return messageCreatedAt <= otherUserLastReadAt;
  };

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
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setMessage("");
    setReplyTo(null);
    setIsEditing(null);
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

  const handleStar = (msg: Message) => {
    setShowContextMenu(null);
  };

  const handleEdit = (msg: Message) => {
    setIsEditing(msg);
    setMessage(msg.content);
    setShowContextMenu(null);
    inputRef.current?.focus();
  };

  // File handling - local drive
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      const fileContent = `[File: ${file.name}]`;
      
      try {
        await sendMessage({
          conversationId: conversationId as Id<"conversations">,
          senderId: user.id,
          content: fileContent,
          mediaUrl: file.name,
          mediaType: fileType,
        });
        console.log("File sent successfully");
      } catch (err) {
        console.error("Error sending file:", err);
      }
    }
    setShowFileMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera capture
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      const photoContent = `[Photo: ${file.name}]`;
      
      try {
        await sendMessage({
          conversationId: conversationId as Id<"conversations">,
          senderId: user.id,
          content: photoContent,
          mediaUrl: file.name,
          mediaType: 'image',
        });
        console.log("Photo sent successfully");
      } catch (err) {
        console.error("Error sending photo:", err);
      }
    }
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // For demo, we'll send a voice message indicator
        handleSendMessage(`[Voice Message ${formatRecordingTime(recordingTime)}]`, `voice_${Date.now()}.webm`, 'audio');
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const groupMessagesByDate = (messages: Message[]) => {
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
  };

  const formatDateSeparator = (dateStr: string) => {
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
  };

  const chatBackground = darkMode 
    ? '#0d1417' 
    : 'linear-gradient(to bottom, #E5DDD5 0%, #D5CFC7 100%)';

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
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{ background: darkMode ? '#131c21' : '#00a884' }}>
        <div className="flex items-center gap-2">
          {isMobile && onBack && (
            <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-300">
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
            {conversation.type === "direct" && otherUser?.isOnline && <span className="status-online" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-white truncate">
              {conversation.type === "group"
                ? conversation.name
                : otherUser?.name || "Unknown"}
            </h2>
            <p className="text-xs text-white/70 flex items-center gap-1">
              {conversation.type === "group" ? (
                <>{conversation.members?.length || 0} participants</>
              ) : (
                <>
                  {otherUser?.isOnline ? "Online" : "Offline"}
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
            <Video className="w-5 h-5 text-white" />
          </button>
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => setShowSearch(!showSearch)} className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
            <Search className="w-5 h-5 text-white" />
          </button>
          <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

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
                  senderName={msg.senderId === user?.id ? "You" : otherUser?.name || "Unknown"}
                  onDelete={() => handleDeleteMessage(msg._id)}
                  onReaction={(emoji) => handleReaction(msg._id, emoji)}
                  onContextMenu={(e) => handleContextMenu(e, msg._id)}
                  onCopy={() => copyMessage(msg.content)}
                  onReply={() => handleReply(msg)}
                  onForward={() => handleForward(msg)}
                  onStar={() => handleStar(msg)}
                  onEdit={() => handleEdit(msg)}
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

      {/* Search Panel */}
      {showSearch && (
        <div 
          className="absolute inset-0 z-20 flex flex-col"
          style={{ background: chatBackground }}
        >
          {/* Search Header */}
          <div className="flex items-center gap-2 p-3" style={{ background: darkMode ? '#131c21' : '#00a884' }}>
            <button 
              onClick={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 rounded-xl px-3 py-2" style={{ background: darkMode ? '#262d31' : '#ffffff' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-transparent text-sm focus:outline-none"
                style={{ color: darkMode ? '#d1d7db' : '#333' }}
                autoFocus
              />
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-2">
            {!searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Search className="w-12 h-12 mb-3" style={{ color: darkMode ? '#555' : '#ccc' }} />
                <p className="font-medium" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
                  Search messages
                </p>
                <p className="text-sm mt-1" style={{ color: darkMode ? '#888' : '#667' }}>
                  Type to search in this conversation
                </p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs px-2 py-1" style={{ color: darkMode ? '#888' : '#667' }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </p>
                {searchResults.map((msg) => (
                  <button
                    key={msg._id}
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-100/10"
                  >
                    <div className="flex items-start gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{ background: msg.senderId === user?.id ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' : (darkMode ? '#262d31' : '#ddd') }}
                      >
                        <span className="text-xs font-medium text-white">
                          {msg.senderId === user?.id ? 'Y' : (otherUser?.name?.charAt(0).toUpperCase() || '?')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
                            {msg.senderId === user?.id ? 'You' : otherUser?.name || 'Unknown'}
                          </p>
                          <span className="text-xs" style={{ color: darkMode ? '#888' : '#667' }}>
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm truncate" style={{ color: darkMode ? '#d1d7db' : '#667' }}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Search className="w-12 h-12 mb-3" style={{ color: darkMode ? '#555' : '#ccc' }} />
                <p className="font-medium" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
                  No results found
                </p>
                <p className="text-sm mt-1" style={{ color: darkMode ? '#888' : '#667' }}>
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className="context-menu-3d fixed z-50"
          style={{ left: showContextMenu.x, top: showContextMenu.y }}
        >
          <div 
            className="context-menu-item" 
            onClick={() => copyMessage("")}
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </div>
          <div className="context-menu-item" onClick={() => {
            const msg = messages?.find(m => m._id === showContextMenu.messageId);
            if (msg) handleReply(msg);
          }}>
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </div>
          <div className="context-menu-item" onClick={() => {
            const msg = messages?.find(m => m._id === showContextMenu.messageId);
            if (msg) handleForward(msg);
          }}>
            <Forward className="w-4 h-4" />
            <span>Forward</span>
          </div>
          <div className="context-menu-item" onClick={() => {
            const msg = messages?.find(m => m._id === showContextMenu.messageId);
            if (msg) handleStar(msg);
          }}>
            <Star className="w-4 h-4" />
            <span>Star</span>
          </div>
          {messages?.find(m => m._id === showContextMenu.messageId)?.senderId === user?.id && (
            <>
              <div className="context-menu-item" onClick={() => {
                const msg = messages?.find(m => m._id === showContextMenu.messageId);
                if (msg) handleEdit(msg);
              }}>
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </div>
              <div 
                className="context-menu-item danger" 
                onClick={() => handleDeleteMessage(showContextMenu.messageId as Id<"messages">)}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Full Emoji Picker */}
      {showFullEmojiPicker && (
        <div 
          className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ background: darkMode ? '#1e2428' : '#fff', maxHeight: '350px' }}
        >
          <div className="p-2 border-b" style={{ borderColor: darkMode ? '#38383A' : '#eee' }}>
            <input
              type="text"
              placeholder="Search emoji..."
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={{ background: darkMode ? '#262d31' : '#f0f0f0', color: darkMode ? '#d1d7db' : '#333' }}
            />
          </div>
          <div className="flex gap-1 p-2 overflow-x-auto border-b" style={{ borderColor: darkMode ? '#38383A' : '#eee' }}>
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs whitespace-nowrap",
                  selectedCategory === category 
                    ? "bg-purple-500 text-white" 
                    : ""
                )}
                style={{ background: selectedCategory === category ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' : (darkMode ? '#262d31' : '#f0f0f0'), color: selectedCategory === category ? 'white' : (darkMode ? '#d1d7db' : '#667') }}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto p-2" style={{ maxHeight: '200px' }}>
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]?.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(prev => prev + emoji);
                    setShowFullEmojiPicker(false);
                    inputRef.current?.focus();
                  }}
                  className="text-2xl p-1 hover:bg-gray-100 rounded-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Menu */}
      {showFileMenu && (
        <div 
          className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-64 rounded-2xl shadow-2xl z-50 p-2"
          style={{ background: darkMode ? '#1e2428' : '#fff' }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100"
            style={{ color: darkMode ? '#d1d7db' : '#333' }}
          >
            <FolderOpen className="w-6 h-6 text-purple-500" />
            <span>Browse Files</span>
          </button>
          <button
            onClick={() => {
              cameraInputRef.current?.click();
              setShowFileMenu(false);
            }}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100"
            style={{ color: darkMode ? '#d1d7db' : '#333' }}
          >
            <Camera className="w-6 h-6 text-pink-500" />
            <span>Take Photo</span>
          </button>
        </div>
      )}

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div 
          className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-64 rounded-2xl shadow-2xl z-50 p-4"
          style={{ background: darkMode ? '#1e2428' : '#fff' }}
        >
          <div className="text-center">
            <div className={cn("w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center", isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300")}>
              {isRecording ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-gray-500" />}
            </div>
            <p className="text-lg font-bold mb-2" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
              {isRecording ? formatRecordingTime(recordingTime) : "Voice Message"}
            </p>
            <div className="flex justify-center gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}
                >
                  <PlayCircle className="w-5 h-5 inline mr-1" />
                  Record
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-full bg-red-500 text-white"
                >
                  <StopCircle className="w-5 h-5 inline mr-1" />
                  Stop
                </button>
              )}
              <button
                onClick={() => {
                  setShowVoiceRecorder(false);
                  setIsRecording(false);
                  if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
                }}
                className="px-4 py-2 rounded-full"
                style={{ background: darkMode ? '#262d31' : '#f0f0f0', color: darkMode ? '#d1d7db' : '#667' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* File Menu Button */}
          <div className="relative">
            <button 
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
            >
              <Paperclip className="w-5 h-5" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
            </button>
          </div>

          {/* Camera Button */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleCameraCapture}
            className="hidden"
            accept="image/*"
            capture="environment"
          />
          
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
          
          {/* Emoji Button */}
          <button 
            onClick={() => setShowFullEmojiPicker(!showFullEmojiPicker)}
            className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <Smile className="w-5 h-5" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
          </button>
          
          {/* Voice Record Button */}
          <button
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className="p-2.5 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            {message.trim() ? (
              <Send className="w-5 h-5 text-white" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', borderRadius: '50%', padding: '4px' }} />
            ) : isRecording ? (
              <div className="w-5 h-5 rounded-full bg-red-500 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
            )}
          </button>
        </div>
        
        {/* Quick Reactions */}
        {message.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-1 pt-1 border-t" style={{ borderColor: darkMode ? '#38383A' : '#eee' }}>
            {["👍", "❤️", "😂", "😮", "😢", "😡", "🤔"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setMessage(prev => prev + emoji)}
                className="text-2xl hover:scale-125 transition-transform animate-bounce-once"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowFullEmojiPicker(true)}
              className="text-sm px-3 py-1 rounded-full font-bold hover:scale-110 transition-transform"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', color: 'white', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)' }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCopy: () => void;
  onReply: () => void;
  onForward: () => void;
  onStar: () => void;
  onEdit: () => void;
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
  showEmojiPicker,
  setShowEmojiPicker,
  darkMode,
}: MessageBubbleProps) {
  // Check if message contains media
  const isImage = message.mediaType === 'image' || message.content?.includes('[Photo]');
  const isVoice = message.mediaType === 'audio' || message.content?.includes('[Voice Message');
  const isFile = message.mediaType === 'file' || message.content?.includes('[File:');

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
      className={cn("flex group", isOwn ? "justify-end" : "justify-start")}
      onContextMenu={onContextMenu}
    >
      <div
        className={cn(
          "max-w-[75%] px-3 py-1.5 rounded-2xl relative cursor-pointer",
          isOwn 
            ? "rounded-br-sm" 
            : "rounded-bl-sm"
        )}
        style={{ 
          background: isOwn 
            ? (darkMode ? 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)' : 'linear-gradient(135deg, #DCF8C6 0%, #c5e8b4 100%)')
            : (darkMode ? '#262d31' : '#ffffff'),
        }}
      >
        {!isOwn && (
          <p 
            className="text-xs font-semibold mb-0.5"
            style={{ color: darkMode ? '#8B5CF6' : '#00a884' }}
          >
            {senderName}
          </p>
        )}
        
        {/* Media content */}
        {isImage && (
          <div className="mb-1">
            <ImageIcon className="w-8 h-8 mx-auto" style={{ color: isOwn ? 'white' : '#667' }} />
            <p className="text-xs text-center" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : '#667' }}>{message.content}</p>
          </div>
        )}
        
        {isVoice && (
          <div className="mb-1 flex items-center gap-2">
            <VoiceLines className="w-5 h-5" style={{ color: isOwn ? 'white' : '#667' }} />
            <p className="text-sm" style={{ color: isOwn ? 'white' : '#333' }}>{message.content}</p>
          </div>
        )}
        
        {isFile && !isImage && !isVoice && (
          <div className="mb-1 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" style={{ color: isOwn ? 'white' : '#667' }} />
            <p className="text-sm" style={{ color: isOwn ? 'white' : '#333' }}>{message.content}</p>
          </div>
        )}
        
        {/* Regular text content */}
        {!isImage && !isVoice && !isFile && (
          <p className="text-sm whitespace-pre-wrap break-words" style={{ color: darkMode ? '#d1d7db' : '#333' }}>
            {message.content}
          </p>
        )}
        
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
          {isOwn && (
            message.status === 'read' ? (
              <CheckCheck className="w-3 h-3 text-blue-500" />
            ) : message.status === 'delivered' ? (
              <CheckCheck className="w-3 h-3" style={{ color: darkMode ? '#888' : '#667' }} />
            ) : (
              <Check className="w-3 h-3" style={{ color: darkMode ? '#888' : '#667' }} />
            )
          )}
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div 
            className="absolute -bottom-2 right-2 flex gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: darkMode ? '#2a3942' : '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <span
                key={emoji}
                className="text-xs flex items-center gap-0.5"
              >
                <span>{emoji}</span>
                {users.length > 1 && <span className="text-[10px]" style={{ color: darkMode ? '#d1d7db' : '#333' }}>{users.length}</span>}
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
              onForward();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Forward className="w-4 h-4" style={{ color: darkMode ? '#d1d7db' : '#667' }} />
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

// Add missing icon component
function FolderOpen({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M2 10h20" />
    </svg>
  );
}

function VoiceLines({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PlayCircle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function StopCircle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
    </svg>
  );
}

function ImageIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
