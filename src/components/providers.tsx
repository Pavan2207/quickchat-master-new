"use client";

import { ReactNode, useEffect, useRef } from "react";
import { ClerkProvider, useUser, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMutation } from "convex/react";
import convex from "@/lib/convex";
import { api } from "@/convex/_generated/api";

interface ProvidersProps {
  children: ReactNode;
}

function SyncUserWithConvex({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const syncUser = useMutation(api.users.syncUser);
  const updateStatus = useMutation(api.users.updateOnlineStatus);
  const isFirstRender = useRef(true);

  // Sync user to Convex when authenticated
  useEffect(() => {
    if (isUserLoaded && isAuthLoaded && userId && user) {
      syncUser({
        userId: userId,
        name: user.fullName || user.username || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl || "",
      });
    }
  }, [user, userId, isUserLoaded, isAuthLoaded, syncUser]);

  // Update online status when user comes to the app
  useEffect(() => {
    if (isUserLoaded && isAuthLoaded && userId) {
      // Mark as online when component mounts
      updateStatus({ userId, isOnline: true });
      
      // Mark as offline when user leaves or closes the tab
      const handleBeforeUnload = () => {
        updateStatus({ userId, isOnline: false });
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          updateStatus({ userId, isOnline: false });
        } else if (document.visibilityState === "visible") {
          updateStatus({ userId, isOnline: true });
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      
      // Heartbeat to keep online status updated
      const heartbeat = setInterval(() => {
        updateStatus({ userId, isOnline: true });
      }, 60000); // Every minute

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        clearInterval(heartbeat);
        // Mark as offline when component unmounts
        updateStatus({ userId, isOnline: false });
      };
    }
  }, [userId, isUserLoaded, isAuthLoaded, updateStatus]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  // Use ngrok URL for tunneling, localhost for local dev, or Vercel for production
  let baseUrl = "http://localhost:3000";
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      baseUrl = "http://localhost:3000";
    } else if (hostname.includes("ngrok-free.app")) {
      // ngrok tunnel URL
      baseUrl = `https://${hostname}`;
    } else if (hostname.includes("loca.lt")) {
      // localtunnel URL
      baseUrl = `https://${hostname}`;
    } else {
      // Production Vercel - use current hostname
      baseUrl = `https://${hostname}`;
    }
  }

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      redirectUrl={baseUrl}
      signInFallbackRedirectUrl={baseUrl}
      signUpFallbackRedirectUrl={baseUrl}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SyncUserWithConvex>{children}</SyncUserWithConvex>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
