import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/hooks/use-auth";

type MainLayoutProps = {
  children: React.ReactNode;
  hideOnMobile?: boolean;
};

export default function MainLayout({ children, hideOnMobile = false }: MainLayoutProps) {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Get notifications count
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch("/api/notifications");
          if (res.ok) {
            const data = await res.json();
            const unread = data.filter((n: any) => !n.read).length;
            setUnreadNotifications(unread);
          }
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      };

      fetchNotifications();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Get messages count
  useEffect(() => {
    if (user) {
      const fetchMessages = async () => {
        try {
          const res = await fetch("/api/messages");
          if (res.ok) {
            const data = await res.json();
            // Count chats with unread messages
            const chatsWithUnread = data.filter((chat: any) => 
              chat.lastMessage.senderId !== user.id && !chat.lastMessage.read
            ).length;
            setUnreadMessages(chatsWithUnread);
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      };

      fetchMessages();
      // Poll every 30 seconds
      const interval = setInterval(fetchMessages, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MobileNav 
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
      />
      
      <main className={`flex-1 relative overflow-y-auto focus:outline-none md:ml-64 lg:ml-72 ${hideOnMobile ? 'hidden md:block' : ''}`}>
        <div className="py-6 px-4 md:px-8 max-w-7xl mx-auto md:pt-4 pb-24 md:pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
