import { useState } from "react";
import { formatTime, cn } from "@/lib/utils";
import UserAvatar from "./user-avatar";
import { Check, CheckCheck } from "lucide-react";

type ChatMessageProps = {
  message: {
    id: number;
    content: string;
    senderId: number;
    receiverId: number;
    sentAt: string;
    read: boolean;
  };
  isCurrentUser: boolean;
  user: {
    id: number;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
};

export default function ChatMessage({ 
  message, 
  isCurrentUser, 
  user 
}: ChatMessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const messageDate = new Date(message.sentAt);
  const formattedTime = formatTime(messageDate);

  return (
    <div 
      className={cn(
        "flex items-start space-x-2 mb-3 group",
        isCurrentUser && "justify-end space-x-0 space-x-reverse"
      )}
      onClick={() => setShowDetails(!showDetails)}
    >
      {!isCurrentUser && (
        <UserAvatar user={user} size="sm" className="mt-0.5" />
      )}
      
      <div 
        className={cn(
          "rounded-lg p-3 max-w-[80%] text-sm",
          isCurrentUser ? 
            "bg-primary-100 text-gray-800 rounded-tr-none" : 
            "bg-gray-100 text-gray-800 rounded-tl-none"
        )}
      >
        <div className="flex justify-between items-center mb-1">
          {!isCurrentUser && (
            <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
          )}
          
          <div className={cn(
            "text-xs text-gray-500 flex items-center space-x-1",
            !isCurrentUser && "ml-auto"
          )}>
            <span>{formattedTime}</span>
            {isCurrentUser && (
              message.read ? 
                <CheckCheck className="h-3 w-3 text-primary" /> : 
                <Check className="h-3 w-3" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
        
        {showDetails && (
          <div className="mt-1 text-xs text-gray-500 group-hover:opacity-100 opacity-0 transition-opacity">
            {new Date(message.sentAt).toLocaleString()}
          </div>
        )}
      </div>
      
      {isCurrentUser && (
        <UserAvatar user={user} size="sm" className="mt-0.5" />
      )}
    </div>
  );
}
