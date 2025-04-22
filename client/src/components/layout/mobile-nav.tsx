import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Home, LogOut, Menu, MessageCircle, Search, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import UserAvatar from "@/components/ui/user-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type MobileNavProps = {
  unreadNotifications?: number;
  unreadMessages?: number;
};

export default function MobileNav({ unreadNotifications = 0, unreadMessages = 0 }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      logout();
      queryClient.clear();
      setOpen(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Nav links
  const links = [
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
    <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="flex flex-col h-full">
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
                        onClick={() => setOpen(false)}
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
                    <a className="flex items-center" onClick={() => setOpen(false)}>
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
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <Video className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-heading font-bold text-gray-900">VidConnect</h1>
        </div>
        
        {unreadNotifications > 0 ? (
          <Link href="/notifications">
            <a className="inline-flex items-center justify-center relative">
              <Bell className="h-6 w-6 text-gray-500" />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            </a>
          </Link>
        ) : (
          <Link href="/notifications">
            <a>
              <Bell className="h-6 w-6 text-gray-500" />
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}
