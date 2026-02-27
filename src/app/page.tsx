"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/Sidebar";
import { Chat as ChatNew } from "@/components/Chat_new";
import { Status } from "@/components/Status";
import Settings from "@/components/Settings";
import {
  MessageCircle,
  Circle,
  Phone,
  Settings as SettingsIcon,
  Camera,
  Search
} from "lucide-react";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "status" | "calls">("chats");
  const [showStatus, setShowStatus] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          {/* Floating orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            {/* 3D Logo */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-75 animate-pulse"></div>
              <div className="relative w-full h-full rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
            </div>
            
            {/* Loading spinner */}
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
            
            <p className="text-white/60 mt-4 text-sm">Loading QuickChat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          {/* Floating orbs with different animations */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/40 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
          {/* Animated grid */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          {/* Main Card */}
          <div className="w-full max-w-md hero-enhanced">
            {/* Logo Section */}
            <div className="text-center mb-8">
              {/* 3D Logo with glow */}
              <div className="w-28 h-28 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 blur-xl opacity-60 animate-pulse"></div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 blur-lg opacity-40"></div>
                <div className="relative w-full h-full rounded-3xl bg-black/50 backdrop-blur-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                  <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-2xl">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  QuickChat
                </span>
              </h1>
              <p className="text-white/70 text-lg mb-2">Message your friends in style! ✨</p>
              <p className="text-white/50 text-sm">Real-time messaging with modern design</p>
            </div>
            
            {/* Glass Card */}
            <div className="backdrop-blur-2xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to QuickChat</h2>
                <p className="text-white/60">Connect with friends instantly</p>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10 feature-card-enhanced feature-stagger-1">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium">Real-time</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10 feature-card-enhanced feature-stagger-2">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium">Secure</p>
                </div>
              </div>

              {/* Sign In Button */}
              <SignInButton mode="modal">
                <button className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 btn-landing-enhanced btn-ripple">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16l4 4V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Get Started 🚀
                </button>
              </SignInButton>
              
              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-white/40 text-sm">or continue with</span>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>
              
              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-white font-medium">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-white font-medium">GitHub</span>
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/40 text-sm">
                Powered by <span className="text-purple-400">Convex</span> + <span className="text-pink-400">Clerk</span>
              </p>
            </div>
          </div>
          
          {/* Floating shapes decoration */}
          <div className="absolute bottom-10 left-10 w-20 h-20 border border-white/10 rounded-2xl rotate-12 opacity-50"></div>
          <div className="absolute top-20 right-20 w-16 h-16 border border-white/10 rounded-full opacity-30"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border border-white/10 rotate-45 opacity-40"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)' }}>
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Only show for chats tab */}
        {activeTab === "chats" && (
          <div
            className={`${
              isMobile && selectedConversationId ? "hidden" : "w-full md:w-[400px] lg:w-[450px]"
            } md:block h-full`}
          >
            <Sidebar
              onSelectConversation={(id) => setSelectedConversationId(id)}
              selectedConversationId={selectedConversationId}
              onBack={isMobile ? () => setSelectedConversationId(null) : undefined}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* Status Component */}
        {activeTab === "status" && (
          <div className="flex-1 h-full">
            <Status onClose={() => setActiveTab("chats")} />
          </div>
        )}

        {/* Calls Placeholder */}
        {activeTab === "calls" && (
          <div className="flex-1 h-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)' }}>
            <div className="text-center max-w-md px-8">
              <div className="w-40 h-40 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl"></div>
                <div className="relative w-full h-full rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10">
                  <Phone className="w-20 h-20 text-purple-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Calls
                </span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Voice and video calls coming soon!<br/>
                Stay tuned for updates.
              </p>
            </div>
          </div>
        )}

        {/* Chat Area - Only show for chats tab */}
        {activeTab === "chats" && selectedConversationId ? (
          <div
            className={`${
              isMobile && !selectedConversationId ? "hidden" : "flex-1"
            } h-full`}
          >
            <ChatNew
              conversationId={selectedConversationId}
              onBack={isMobile ? () => setSelectedConversationId(null) : undefined}
              isMobile={isMobile}
            />
          </div>
        ) : activeTab === "chats" && (
          <div className="hidden md:flex flex-1 items-center justify-center" style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%)' }}>
            <div className="text-center max-w-md px-8">
              <div className="w-40 h-40 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-2xl"></div>
                <div className="relative w-full h-full rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center border border-white/10">
                  <svg className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  QuickChat Web
                </span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Send messages, share media, and connect with friends.<br/>
                Your conversations, encrypted and secure.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - WhatsApp Style */}
      <div className="flex items-center justify-around py-2 px-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <button
          onClick={() => {
            setActiveTab("chats");
            setSelectedConversationId(null);
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
            activeTab === "chats" ? "text-green-500" : "text-white/60 hover:text-white/80"
          }`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs font-medium">Chats</span>
        </button>

        <button
          onClick={() => setActiveTab("status")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
            activeTab === "status" ? "text-green-500" : "text-white/60 hover:text-white/80"
          }`}
        >
          <Circle className="w-6 h-6" />
          <span className="text-xs font-medium">Status</span>
        </button>

        <button
          onClick={() => setActiveTab("calls")}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
            activeTab === "calls" ? "text-green-500" : "text-white/60 hover:text-white/80"
          }`}
        >
          <Phone className="w-6 h-6" />
          <span className="text-xs font-medium">Calls</span>
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 text-white/60 hover:text-white/80"
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-md h-full">
            <Settings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
