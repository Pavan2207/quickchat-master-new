"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { cn, formatMessageTime } from "@/lib/utils";
import {
  X,
  Plus,
  Eye,
  MessageCircle,
  Send,
  Image,
  Type,
  Trash2,
  Settings,
  Users,
  Clock,
} from "lucide-react";

interface StatusItem {
  _id: Id<"status">;
  userId: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  views: string[];
  createdAt: number;
  expiresAt: number;
}

interface ContactStatusItem {
  user: {
    userId: string;
    name: string;
    image?: string;
  };
  status: StatusItem[];
}

interface StatusProps {
  onClose: () => void;
}

export function Status({ onClose }: StatusProps) {
  const { user: clerkUser, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"my" | "contacts">("contacts");
  const [selectedStatus, setSelectedStatus] = useState<StatusItem | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [newStatusText, setNewStatusText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const myStatus = useQuery(api.status.getMyStatus, {
    userId: clerkUser?.id || "",
  });

  const contactsStatus = useQuery(api.status.getContactsStatus, {
    userId: clerkUser?.id || "",
  });

  const createStatusMutation = useMutation(api.status.createStatus);
  const viewStatusMutation = useMutation(api.status.viewStatus);
  const deleteStatusMutation = useMutation(api.status.deleteStatus);
  const replyToStatusMutation = useMutation(api.status.replyToStatus);

  // Group status by user - contactsStatus is already grouped by user from backend
  const getStatusListForUser = (userId: string): StatusItem[] => {
    const contactStatus = contactsStatus?.find((c: ContactStatusItem) => c.user?.userId === userId);
    return contactStatus?.status || [];
  };

  // Get user details for display
  const getUserDetails = (userId: string) => {
    const contactStatus = contactsStatus?.find((c: ContactStatusItem) => c.user?.userId === userId);
    return contactStatus?.user;
  };

  // Auto-progress through status updates
  useEffect(() => {
    if (selectedStatus && selectedUserId) {
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next status in the list
            const currentList = getStatusListForUser(selectedUserId);
            const currentIdx = currentList.findIndex((s) => s._id === selectedStatus._id);
            if (currentIdx < currentList.length - 1) {
              setSelectedStatus(currentList[currentIdx + 1]);
              return 0;
            } else {
              setSelectedStatus(null);
              setSelectedUserId(null);
              return 100;
            }
          }
          return prev + 2; // ~50 seconds for full status
        });
      }, 1000);

      return () => {
        if (progressRef.current) {
          clearInterval(progressRef.current);
        }
      };
    }
  }, [selectedStatus, selectedUserId, contactsStatus]);

  const handleCreateStatus = async () => {
    if (!clerkUser?.id || (!newStatusText && !selectedImage)) return;

    await createStatusMutation({
      userId: clerkUser.id,
      content: newStatusText,
      mediaType: selectedImage ? "image" : "text",
      mediaUrl: selectedImage,
    });

    setNewStatusText("");
    setSelectedImage(undefined);
    setShowCreate(false);
    setActiveTab("my");
  };

  const handleViewStatus = async (status: StatusItem) => {
    if (!clerkUser?.id) return;
    
    if (!status.views.includes(clerkUser.id)) {
      await viewStatusMutation({
        statusId: status._id,
        viewerId: clerkUser.id,
      });
    }
  };

  const handleReply = async () => {
    if (!clerkUser?.id || !selectedStatus || !replyContent.trim()) return;

    await replyToStatusMutation({
      statusId: selectedStatus._id,
      userId: clerkUser.id,
      content: replyContent,
    });

    setReplyContent("");
    setShowReply(false);
  };

  const handleDeleteStatus = async (statusId: Id<"status">) => {
    await deleteStatusMutation({ statusId });
    setSelectedStatus(null);
    setSelectedUserId(null);
  };

  // View a specific status
  const openStatusViewer = (status: StatusItem, userId: string) => {
    handleViewStatus(status);
    setSelectedStatus(status);
    setSelectedUserId(userId);
    setViewingIndex(0);
    setProgress(0);
  };

  // Full screen status viewer
  if (selectedStatus && selectedUserId) {
    const userDetails = getUserDetails(selectedUserId);
      const currentList = getStatusListForUser(selectedUserId);
      
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {currentList.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{
                    width: idx < viewingIndex ? '100%' : idx === viewingIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-16 left-4 right-4 flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedStatus(null);
                setSelectedUserId(null);
              }}
              className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {userDetails?.image ? (
                  <img src={userDetails.image} alt={userDetails.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {userDetails?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-semibold">{userDetails?.name || "Unknown"}</p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMessageTime(selectedStatus.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteStatus(selectedStatus._id)}
              className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-16 pt-32 pb-24">
            {selectedStatus.mediaType === "image" && selectedStatus.mediaUrl && (
              <img
                src={selectedStatus.mediaUrl}
                alt="Status"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            )}
            {selectedStatus.mediaType === "video" && selectedStatus.mediaUrl && (
              <video
                src={selectedStatus.mediaUrl}
                className="max-h-full max-w-full object-contain rounded-lg"
                controls
              />
            )}
            {selectedStatus.mediaType === "text" && (
              <div className="text-center px-8">
                <p className="text-2xl font-bold text-white leading-relaxed">
                  {selectedStatus.content}
                </p>
              </div>
            )}
          </div>

          {/* Reply section */}
          {showReply ? (
            <div className="absolute bottom-20 left-4 right-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full p-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Reply to status..."
                  className="flex-1 bg-transparent text-white px-4 outline-none"
                />
                <button
                  onClick={handleReply}
                  className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-20 left-4 right-4 flex gap-2">
              <button
                onClick={() => setShowReply(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white/10 backdrop-blur-xl rounded-full py-3 text-white hover:bg-white/20 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Reply</span>
              </button>
              <button className="p-3 rounded-full bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-colors">
                <Eye className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* View count */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/60 text-sm">
            <Eye className="w-4 h-4" />
            <span>{selectedStatus.views.length} views</span>
          </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-xl font-bold text-white">Status</h2>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("contacts")}
          className={cn(
            "flex-1 py-3 text-center font-medium transition-colors",
            activeTab === "contacts"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-white/60"
          )}
        >
          Contacts&apos; Status
        </button>
        <button
          onClick={() => setActiveTab("my")}
          className={cn(
            "flex-1 py-3 text-center font-medium transition-colors",
            activeTab === "my"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-white/60"
          )}
        >
          My Status
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "contacts" ? (
          <div className="space-y-4">
            {/* My status preview at top */}
            {myStatus && myStatus.length > 0 && (
              <div
                onClick={() => openStatusViewer(myStatus[0], clerkUser?.id || "")}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-purple-500">
                    {clerkUser?.imageUrl ? (
                      <img
                        src={clerkUser.imageUrl}
                        alt="My status"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {clerkUser?.firstName?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">My Status</p>
                  <p className="text-white/60 text-sm">
                    {myStatus.length} update{myStatus.length > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-white/40 text-xs">
                  {formatMessageTime(myStatus[0]?.createdAt || 0)}
                </span>
              </div>
            )}

            {/* Add status button if no status */}
            {(!myStatus || myStatus.length === 0) && (
              <div
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">Add Status</p>
                  <p className="text-white/60 text-sm">Share updates with your contacts</p>
                </div>
              </div>
            )}

            {/* Recent updates */}
            {contactsStatus?.map((contact: ContactStatusItem) => {
              const statusList = contact.status || [];
              const user = contact.user;
              if (!user || statusList.length === 0) return null;
              const hasUnviewed = statusList.some((s) => !s.views.includes(clerkUser?.id || ""));
              
              return (
                <div
                  key={user.userId}
                  onClick={() => openStatusViewer(statusList[0], user.userId)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <div className={cn(
                      "w-16 h-16 rounded-full overflow-hidden",
                      hasUnviewed ? "ring-2 ring-green-500" : "ring-2 ring-gray-500"
                    )}>
                      {user?.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">
                            {user?.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{user?.name || "Unknown"}</p>
                    <p className="text-white/60 text-sm">
                      {statusList.length} update{statusList.length > 1 ? "s" : ""} •{" "}
                      {formatMessageTime(statusList[statusList.length - 1]?.createdAt || 0)}
                    </p>
                  </div>
                  {hasUnviewed && (
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  )}
                </div>
              );
            })}

            {(!contactsStatus || contactsStatus.length === 0) && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-10 h-10 text-white/40" />
                </div>
                <p className="text-white/60">No status updates yet</p>
                <p className="text-white/40 text-sm mt-1">When your contacts add status updates, you&apos;ll see them here</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* My status list */}
            {myStatus?.map((status) => (
              <div
                key={status._id}
                onClick={() => openStatusViewer(status, clerkUser?.id || "")}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
                  {status.mediaType === "image" && status.mediaUrl ? (
                    <img src={status.mediaUrl} alt="Status" className="w-full h-full object-cover" />
                  ) : status.mediaType === "text" ? (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-white text-xs line-clamp-3">{status.content}</p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Type className="w-6 h-6 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">My Status</p>
                  <p className="text-white/60 text-sm flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {formatMessageTime(status.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {status.views.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStatus(status._id);
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add new status button */}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-semibold">Add Status Update</span>
            </button>

            {(!myStatus || myStatus.length === 0) && (
              <div className="text-center py-8">
                <p className="text-white/60">You haven&apos;t added any status updates yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Status Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md mx-4 rounded-2xl overflow-hidden" style={{ background: '#1A1A2E' }}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Create Status</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Image selection */}
              <div className="flex gap-2">
                <button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <Image className="w-8 h-8 text-purple-400" />
                  <span className="text-white/80 text-sm">Photo</span>
                </button>
                <button className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <Type className="w-8 h-8 text-purple-400" />
                  <span className="text-white/80 text-sm">Text</span>
                </button>
              </div>

              {/* Text input */}
              <textarea
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-4 rounded-xl bg-white/5 text-white placeholder-white/40 outline-none resize-none"
              />

              {/* Submit button */}
              <button
                onClick={handleCreateStatus}
                disabled={!newStatusText && !selectedImage}
                className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-white font-semibold">Share Status</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
