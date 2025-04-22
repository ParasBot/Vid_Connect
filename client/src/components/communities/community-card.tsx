import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UsersRound } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type CommunityCardProps = {
  community: {
    id: number;
    name: string;
    description: string;
    coverImageUrl?: string | null;
    createdAt: string;
  };
  memberCount?: number;
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  isLoading?: boolean;
};

export default function CommunityCard({
  community,
  memberCount = 0,
  isMember = false,
  onJoin,
  onLeave,
  isLoading = false
}: CommunityCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <AspectRatio ratio={16/9}>
        <div className="h-full w-full bg-gradient-to-br from-primary-100/80 to-primary-600/50 flex items-center justify-center">
          {community.coverImageUrl ? (
            <img 
              src={community.coverImageUrl} 
              alt={community.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <UsersRound className="h-12 w-12 text-primary" />
          )}
        </div>
      </AspectRatio>
      
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{community.name}</h3>
            <p className="text-sm text-gray-500">Created {formatDate(community.createdAt)}</p>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <UsersRound className="h-4 w-4 mr-1" />
            <span>{memberCount}</span>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {community.description}
        </p>
      </CardContent>
      
      <CardFooter className="px-5 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex w-full justify-between items-center">
          <Link href={`/communities/${community.id}`}>
            <Button variant="ghost" size="sm">
              View Community
            </Button>
          </Link>
          
          {isMember ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLeave}
              disabled={isLoading}
            >
              Leave
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={onJoin}
              disabled={isLoading}
            >
              Join
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
