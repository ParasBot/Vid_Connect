import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/ui/user-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Home, LogOut, MessageCircle, Search, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SidebarLink = {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      logout();
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const links: SidebarLink[] = [
    {
      name: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Communities",
      href: "/communities",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: <MessageCircle className="h-5 w-5" />,
      badge: unreadMessages,
    },
    {
      name: "Discover",
      href: "/search",
      icon: <Search className="h-5 w-5" />,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      badge: unreadNotifications,
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col fixed inset-y-0 z-10 border-r border-gray-200 bg-white">
      <div className="px-4 py-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Video className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">VidConnect</h1>
        </div>
        
        <nav className="space-y-1.5">
          {links.map((link) => (
            <Link key={link.name} href={link.href}>
              <a
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md group transition-colors",
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {link.icon}
                <span className="font-medium ml-3">{link.name}</span>
                {link.badge ? (
                  <span className="ml-auto bg-primary text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    {link.badge}
                  </span>
                ) : null}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Link href={`/profile/${user.id}`}>
            <a className="flex items-center">
              <UserAvatar
                user={user}
                className="h-9 w-9"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </a>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto" 
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
