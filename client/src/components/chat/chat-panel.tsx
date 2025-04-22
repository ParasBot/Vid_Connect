import { useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ui/chat-message";
import MessageInput from "./message-input";
import UserAvatar from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getWebSocketUrl, checkWebSocketHealth, WebSocketHealth } from "@/lib/utils";
import { ArrowLeft, Info, Video } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTime } from "@/lib/utils";

// Define a custom WebSocket type with our additional properties
interface ExtendedWebSocket extends WebSocket {
  pingIntervalId?: number | NodeJS.Timeout;
}

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
  const [wsHealth, setWsHealth] = useState<WebSocketHealth | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

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
    let ws: ExtendedWebSocket;

    // Function to create and setup WebSocket
    const connectWebSocket = () => {
      try {
        // Create WebSocket connection
        const wsUrl = getWebSocketUrl();
        console.log("Connecting to WebSocket at:", wsUrl);
        
        // Add timestamp to avoid caching of the WebSocket connection in reverse proxies
        const uniqueUrl = `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        console.log("Using unique URL:", uniqueUrl);
        
        setConnectionStatus('connecting');
        ws = new WebSocket(uniqueUrl) as ExtendedWebSocket;

        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          // Reset reconnect attempts on successful connection
          reconnectAttempts = 0;
          
          // Authenticate with the WebSocket
          ws.send(JSON.stringify({ type: "auth", userId: user.id }));
          
          // Send a ping immediately to test the connection
          try {
            ws.send(JSON.stringify({ type: "ping" }));
            console.log("Initial ping sent");
          } catch (err) {
            console.error("Failed to send initial ping:", err);
          }
          
          // Check WebSocket server health
          checkWebSocketHealth().then(health => {
            if (health) {
              setWsHealth(health);
              console.log("WebSocket server health:", health);
            }
          });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "auth_success") {
              console.log("Authentication successful:", data.message);
              setConnectionStatus('connected');
            } else if (data.type === "pong") {
              console.log("Received pong from server:", data.timestamp);
              
              // Setup regular pinging to keep connection alive (every 30 seconds)
              const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  try {
                    ws.send(JSON.stringify({ type: "ping" }));
                    console.log("Ping sent");
                  } catch (err) {
                    console.error("Failed to send ping:", err);
                    clearInterval(pingInterval);
                  }
                } else {
                  console.warn("WebSocket not open, clearing ping interval");
                  clearInterval(pingInterval);
                }
              }, 30000);
              
              // Store the interval ID so we can clear it on unmount
              (ws as any).pingIntervalId = pingInterval;
            } else if (data.type === "message" && data.from === chatUser.id) {
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
          setConnectionStatus('disconnected');
        };

        ws.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          setConnectionStatus('disconnected');
          
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
        // Clear any ping intervals
        if ((ws as any).pingIntervalId) {
          clearInterval((ws as any).pingIntervalId);
          console.log("Cleared ping interval on unmount");
        }
        
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
  
  // Periodically check WebSocket health
  useEffect(() => {
    if (!user) return;
    
    // Check WebSocket health every 30 seconds
    const healthCheckInterval = setInterval(async () => {
      try {
        const health = await checkWebSocketHealth();
        if (health) {
          setWsHealth(health);
          console.log("WebSocket server health:", health);
        }
      } catch (error) {
        console.error("Error checking WebSocket health:", error);
      }
    }, 30000);
    
    // Initial health check
    checkWebSocketHealth().then(health => {
      if (health) {
        setWsHealth(health);
        console.log("Initial WebSocket server health:", health);
      }
    });
    
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [user]);

  // Combine fetched and pending messages
  const allMessages = [...messages, ...pendingMessages].sort((a, b) => {
    return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
  });

  // Function to manually reconnect WebSocket
  const handleReconnect = () => {
    if (websocket) {
      // Close existing connection if any
      if (websocket.readyState === WebSocket.OPEN || 
          websocket.readyState === WebSocket.CONNECTING) {
        websocket.close();
      }
      
      // Create a new connection
      const wsUrl = getWebSocketUrl();
      const uniqueUrl = `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      
      setConnectionStatus('connecting');
      const newWs = new WebSocket(uniqueUrl);
      
      // Set up event handlers
      newWs.onopen = () => {
        if (user) {
          newWs.send(JSON.stringify({ type: "auth", userId: user.id }));
          setConnectionStatus('connected');
          toast({
            title: "Reconnected",
            description: "WebSocket connection restored",
          });
        }
      };
      
      newWs.onerror = () => {
        setConnectionStatus('disconnected');
        toast({
          title: "Connection Failed",
          description: "Could not establish WebSocket connection",
          variant: "destructive"
        });
      };
      
      setWebsocket(newWs);
    }
  };

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
        
        {/* Connection status indicator */}
        <div className="mr-2 flex items-center">
          <div className={`h-2 w-2 rounded-full mr-1 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-500">
            {connectionStatus === 'connected' ? 'Online' : 
             connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
          </span>
          
          {/* Health info tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                  <Info className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <div className="text-xs">
                  <p className="font-semibold mb-1">WebSocket Health</p>
                  {wsHealth ? (
                    <div className="grid grid-cols-2 gap-1">
                      <span>Status:</span>
                      <span className={`${wsHealth.status === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
                        {wsHealth.status.toUpperCase()}
                      </span>
                      
                      <span>Last Updated:</span>
                      <span>{formatTime(wsHealth.timestamp)}</span>
                      
                      <span>Active Connections:</span>
                      <span>{wsHealth.activeConnections}</span>
                      
                      <span>Server Uptime:</span>
                      <span>{Math.round(wsHealth.serverUptime / 60)} minutes</span>
                      
                      <span>Client Status:</span>
                      <span className={`${
                        connectionStatus === 'connected' ? 'text-green-500' : 
                        connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {connectionStatus.toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <p>No health data available</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {connectionStatus !== 'connected' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-1 text-xs py-1 h-6"
              onClick={handleReconnect}
              disabled={connectionStatus === 'connecting'}
            >
              Reconnect
            </Button>
          )}
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
