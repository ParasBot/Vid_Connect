import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/ui/user-avatar";
import { MessageCircle, Video } from "lucide-react";
import { truncate } from "@/lib/utils";

type UserCardProps = {
  user: {
    id: number;
    username: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
    introVideoUrl?: string | null;
  };
  showActions?: boolean;
};

export default function UserCard({ user, showActions = true }: UserCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex flex-col items-center">
          <UserAvatar user={user} size="xl" className="mb-3" />
          
          <h3 className="text-lg font-semibold text-gray-900">{user.displayName}</h3>
          <p className="text-sm text-gray-500">@{user.username}</p>
          
          {user.introVideoUrl && (
            <div className="mt-2 flex items-center text-primary text-sm">
              <Video className="h-4 w-4 mr-1" />
              <span>Has intro video</span>
            </div>
          )}
          
          {user.bio && (
            <p className="mt-3 text-sm text-gray-600 text-center">
              {truncate(user.bio, 100)}
            </p>
          )}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <div className="w-full flex justify-center space-x-3">
            <Link href={`/profile/${user.id}`}>
              <Button variant="outline" size="sm" className="flex-1">
                View Profile
              </Button>
            </Link>
            
            <Link href={`/messages/${user.id}`}>
              <Button size="sm" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Button>
            </Link>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
