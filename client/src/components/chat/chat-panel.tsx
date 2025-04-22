import { useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ui/chat-message";
import MessageInput from "./message-input";
import UserAvatar from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { getWebSocketUrl } from "@/lib/utils";
import { ArrowLeft, Video } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  read: boolean;
};

type ChatPanelProps = {
  chatUser: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  onBack?: () => void;
};

export default function ChatPanel({ chatUser, onBack }: ChatPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${chatUser.id}`],
    enabled: !!user?.id && !!chatUser?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    let reconnectTimeout: number | NodeJS.Timeout;
    let ws: WebSocket;

    // Function to create and setup WebSocket
    const connectWebSocket = () => {
      try {
        // Create WebSocket connection
        const wsUrl = getWebSocketUrl();
        console.log("Connecting to WebSocket at:", wsUrl);
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");
          // Reset reconnect attempts on successful connection
          reconnectAttempts = 0;
          // Authenticate with the WebSocket
          ws.send(JSON.stringify({ type: "auth", userId: user.id }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "message" && data.from === chatUser.id) {
              // Add the new message to pending messages
              setPendingMessages(prev => [...prev, {
                id: data.id,
                senderId: data.from,
                receiverId: user.id,
                content: data.content,
                sentAt: data.sentAt || new Date().toISOString(),
                read: false
              }]);
              
              // Mark the message as read
              apiRequest("POST", `/api/messages/${chatUser.id}/read`, {})
                .catch(err => console.error("Failed to mark message as read:", err));
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          
          // Try to reconnect unless this was a normal closure or component unmounting
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            // Exponential backoff for reconnection attempts
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
            
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connectWebSocket, delay);
          }
        };

        setWebsocket(ws);
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        
        // Try to reconnect with backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`Error creating WebSocket. Retrying in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        }
      }
    };

    // Initial connection
    connectWebSocket();

    // Clean up on unmount
    return () => {
      if (ws) {
        // Use code 1000 (Normal Closure) to indicate intentional close
        ws.close(1000, "Component unmounting");
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user?.id, chatUser.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingMessages]);

  // Combine fetched and pending messages
  const allMessages = [...messages, ...pendingMessages].sort((a, b) => {
    return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
  });

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const tempMessage: Message = {
        id: Date.now(), // Temporary ID
        senderId: user.id,
        receiverId: chatUser.id,
        content,
        sentAt: new Date().toISOString(),
        read: false
      };

      // Add message to pending
      setPendingMessages(prev => [...prev, tempMessage]);

      // Send via WebSocket if available
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: "message",
          to: chatUser.id,
          content
        }));
      } else {
        // Fallback to REST API
        await apiRequest("POST", `/api/messages/${chatUser.id}`, { content });
      }

      // Invalidate messages query
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/${chatUser.id}`],
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <UserAvatar user={chatUser} />
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{chatUser.displayName}</h3>
          <p className="text-xs text-gray-500">@{chatUser.username}</p>
        </div>
        
        <Link href={`/profile/${chatUser.id}`}>
          <Button variant="ghost" size="sm">
            View Profile
          </Button>
        </Link>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-primary mb-2"></div>
              <p className="text-sm text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-gray-100 rounded-full p-3 mb-3">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">No messages yet</h3>
            <p className="text-sm text-gray-500 max-w-md">
              Send a message to start a conversation with {chatUser.displayName}
            </p>
          </div>
        ) : (
          <>
            {allMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === user?.id}
                user={message.senderId === user?.id ? user : chatUser}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 p-3 bg-white">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
