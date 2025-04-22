import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, generateAvatarColor, cn } from "@/lib/utils";
import { User } from "lucide-react";

type UserAvatarProps = {
  user: {
    displayName?: string;
    username?: string;
    avatarUrl?: string | null;
  };
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: string;
};

export default function UserAvatar({ 
  user, 
  className, 
  size = "md", 
  fallback 
}: UserAvatarProps) {
  const name = user?.displayName || user?.username || "";
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20"
  };
  
  const fontSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
    xl: "text-xl"
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={user?.avatarUrl || undefined} 
        alt={name}
      />
      <AvatarFallback className={cn(generateAvatarColor(name), fontSizeClasses[size])}>
        {fallback || (name ? getInitials(name) : <User className="h-4 w-4" />)}
      </AvatarFallback>
    </Avatar>
  );
}
