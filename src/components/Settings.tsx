"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function Settings() {
  const { user } = useUser();

  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    showReadReceipts: true,
    allowGroupInvites: true,
    theme: "dark",
    notificationSound: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSound = localStorage.getItem("notificationSound");
    if (savedSound !== null) {
      setSettings((prev) => ({
        ...prev,
        notificationSound: savedSound === "true",
      }));
    }
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    const newValue = !settings[key];

    setSettings((prev) => ({
      ...prev,
      [key]: newValue,
    }));

    if (key === "notificationSound") {
      localStorage.setItem("notificationSound", String(newValue));
    }
  };

  return (
    <div className="p-5 text-white">
      <h2 className="text-xl mb-4">User Settings</h2>

      <div className="flex flex-col gap-3">

        <label className="flex justify-between">
          Show Online Status
          <input
            type="checkbox"
            checked={settings.showOnlineStatus}
            onChange={() => handleToggle("showOnlineStatus")}
          />
        </label>

        <label className="flex justify-between">
          Show Last Seen
          <input
            type="checkbox"
            checked={settings.showLastSeen}
            onChange={() => handleToggle("showLastSeen")}
          />
        </label>

        <label className="flex justify-between">
          Show Read Receipts
          <input
            type="checkbox"
            checked={settings.showReadReceipts}
            onChange={() => handleToggle("showReadReceipts")}
          />
        </label>

        <label className="flex justify-between">
          Allow Group Invites
          <input
            type="checkbox"
            checked={settings.allowGroupInvites}
            onChange={() => handleToggle("allowGroupInvites")}
          />
        </label>

        <label className="flex justify-between">
          Notification Sound
          <input
            type="checkbox"
            checked={settings.notificationSound}
            onChange={() => handleToggle("notificationSound")}
          />
        </label>

      </div>
    </div>
  );
}