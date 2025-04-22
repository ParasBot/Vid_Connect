import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/user-avatar";
import ChatPanel from "@/components/chat/chat-panel";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, MessageCircle, Search, User } from "lucide-react";

type MessagesProps = {
  selectedUserId?: number;
};

export default function Messages({ selectedUserId }: MessagesProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Check if the view is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);
  
  // Fetch recent chats
  const { data: recentChats = [], isLoading: isChatsLoading } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Fetch selected user details if provided
  const { data: userDetails, isLoading: isUserLoading } = useQuery({
    queryKey: [`/api/users/${selectedUserId}`],
    enabled: !!selectedUserId,
  });
  
  // Update filtered chats when search query changes
  useEffect(() => {
    if (!recentChats) return;
    
    if (!searchQuery) {
      setFilteredChats(recentChats);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = recentChats.filter((chat: any) => 
      chat.user.displayName.toLowerCase().includes(query) ||
      chat.user.username.toLowerCase().includes(query) ||
      chat.lastMessage.content.toLowerCase().includes(query)
    );
    
    setFilteredChats(filtered);
  }, [recentChats, searchQuery]);
  
  // Set selected user when selectedUserId changes or when userDetails is loaded
  useEffect(() => {
    if (selectedUserId && userDetails) {
      setSelectedUser(userDetails);
    } else if (selectedUserId && !isUserLoading) {
      // If user details failed to load
      const chatWithUser = recentChats.find((chat: any) => chat.user.id === selectedUserId);
      if (chatWithUser) {
        setSelectedUser(chatWithUser.user);
      }
    }
  }, [selectedUserId, userDetails, isUserLoading, recentChats]);
  
  // Handle chat selection
  const handleSelectChat = (chatUser: any) => {
    setSelectedUser(chatUser);
    // Update URL for direct linking
    setLocation(`/messages/${chatUser.id}`);
  };
  
  // Handle back button (mobile view)
  const handleBack = () => {
    setSelectedUser(null);
    setLocation("/messages");
  };
  
  // Show only the chat panel on mobile if a user is selected
  if (isMobileView && selectedUser) {
    return (
      <MainLayout hideOnMobile={false}>
        <ChatPanel chatUser={selectedUser} onBack={handleBack} />
      </MainLayout>
    );
  }
  
  if (!user) return null;
  
  return (
    <MainLayout>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Messages
          </h2>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] overflow-hidden rounded-lg border border-gray-200">
        {/* Chat List */}
        <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col ${selectedUser ? 'hidden md:flex' : ''}`}>
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search messages..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {isChatsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center p-6">
                <div className="bg-gray-100 rounded-full p-3 mx-auto w-fit mb-3">
                  <MessageCircle className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">No messages yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery ? "No messages match your search." : "Start a conversation with someone."}
                </p>
                
                {!searchQuery && (
                  <Link href="/search">
                    <Button>
                      <User className="h-4 w-4 mr-2" />
                      Find People
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredChats.map((chat: any) => (
                  <li key={chat.userId}>
                    <button
                      className={`w-full p-3 flex items-start hover:bg-gray-50 transition-colors text-left ${
                        selectedUser?.id === chat.user.id ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => handleSelectChat(chat.user)}
                    >
                      <UserAvatar user={chat.user} />
                      
                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {chat.user.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(chat.lastMessage.sentAt)}
                          </p>
                        </div>
                        
                        <div className="flex items-center">
                          <p className={`text-sm truncate ${
                            chat.lastMessage.read || chat.lastMessage.senderId === user.id
                              ? 'text-gray-500'
                              : 'text-gray-900 font-medium'
                          }`}>
                            {chat.lastMessage.senderId === user.id ? (
                              <>You: {chat.lastMessage.content}</>
                            ) : (
                              chat.lastMessage.content
                            )}
                          </p>
                          
                          {!chat.lastMessage.read && chat.lastMessage.senderId !== user.id && (
                            <span className="ml-2 h-2 w-2 bg-primary rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Chat Panel */}
        <div className={`flex-1 ${!selectedUser ? 'hidden md:block' : ''}`}>
          {selectedUser ? (
            <ChatPanel chatUser={selectedUser} onBack={handleBack} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4">
              <div className="text-center max-w-md mx-auto">
                <div className="bg-gray-100 p-4 rounded-full mx-auto w-fit mb-3">
                  <MessageCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Your Messages</h3>
                <p className="text-gray-500 mb-6">
                  Select a conversation from the list or start a new one by finding people to connect with.
                </p>
                
                <Link href="/search">
                  <Button>
                    <User className="h-4 w-4 mr-2" />
                    Find People
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
