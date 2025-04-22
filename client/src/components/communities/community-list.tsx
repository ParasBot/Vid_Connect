import { useState } from "react";
import CommunityCard from "./community-card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type Community = {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  coverImageUrl: string | null;
  createdAt: string;
};

type CommunityListProps = {
  communities: Community[];
  memberCounts?: Record<number, number>;
  userMemberships?: number[];
  isLoading?: boolean;
  onJoinLeaveSuccess?: () => void;
};

export default function CommunityList({
  communities,
  memberCounts = {},
  userMemberships = [],
  isLoading = false,
  onJoinLeaveSuccess
}: CommunityListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingCommunityId, setLoadingCommunityId] = useState<number | null>(null);

  const handleJoinCommunity = async (communityId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join communities",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingCommunityId(communityId);
      await apiRequest("POST", `/api/communities/${communityId}/join`, {});
      
      toast({
        title: "Success!",
        description: "You've joined the community."
      });
      
      // Invalidate queries that depend on user membership
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/members`] });
      
      if (onJoinLeaveSuccess) {
        onJoinLeaveSuccess();
      }
    } catch (error) {
      toast({
        title: "Failed to join",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoadingCommunityId(null);
    }
  };

  const handleLeaveCommunity = async (communityId: number) => {
    if (!user) return;

    try {
      setLoadingCommunityId(communityId);
      await apiRequest("POST", `/api/communities/${communityId}/leave`, {});
      
      toast({
        title: "Left community",
        description: "You have successfully left the community."
      });
      
      // Invalidate queries that depend on user membership
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/members`] });
      
      if (onJoinLeaveSuccess) {
        onJoinLeaveSuccess();
      }
    } catch (error) {
      toast({
        title: "Failed to leave",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoadingCommunityId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <Alert className="bg-gray-50 border border-gray-200">
        <AlertDescription>
          No communities found. Create a new community to get started!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          memberCount={memberCounts[community.id] || 0}
          isMember={userMemberships.includes(community.id)}
          onJoin={() => handleJoinCommunity(community.id)}
          onLeave={() => handleLeaveCommunity(community.id)}
          isLoading={loadingCommunityId === community.id}
        />
      ))}
    </div>
  );
}
