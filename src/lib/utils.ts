import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (messageDate.getTime() === today.getTime()) {
    return timeStr;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (messageDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  }

  const year = date.getFullYear();
  const currentYear = now.getFullYear();

  if (year !== currentYear) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + `, ${timeStr}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + `, ${timeStr}`;
}
