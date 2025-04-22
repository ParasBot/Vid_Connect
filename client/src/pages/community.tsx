import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import UserList from "@/components/users/user-list";
import VideoPlayer from "@/components/ui/video-player";
import VideoRecorder from "@/components/ui/video-recorder";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Camera, Loader2, MessageCircle, UserPlus, Users, Video } from "lucide-react";

type CommunityProps = {
  id: number;
};

export default function Community({ id }: CommunityProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("about");
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showJoinWithVideo, setShowJoinWithVideo] = useState(false);

  // Get community details
  const { data: community, isLoading: isCommunityLoading } = useQuery({
    queryKey: [`/api/communities/${id}`],
    enabled: !!id,
  });

  // Get community members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: [`/api/communities/${id}/members`],
    enabled: !!id,
  });

  // Get community videos
  const { data: videos = [], isLoading: isVideosLoading } = useQuery({
    queryKey: [`/api/videos/community/${id}`],
    enabled: !!id,
  });

  // Check if user is a member
  const { data: isMember, isLoading: isCheckingMembership } = useQuery({
    queryKey: [`/api/communities/${id}/is-member`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/communities/${id}/is-member`);
        return response.ok ? await response.json() : false;
      } catch (error) {
        return false;
      }
    },
    enabled: !!user && !!id,
  });

  // Get user's intro video for this community
  const userMember = members.find((member: any) => member.userId === user?.id);
  const userIntroVideo = userMember?.introVideoUrl;

  const handleJoinCommunity = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join communities",
        variant: "destructive"
      });
      return;
    }

    if (showJoinWithVideo) {
      setIsRecording(true);
      return;
    }

    try {
      await apiRequest("POST", `/api/communities/${id}/join`, {});
      
      toast({
        title: "Success!",
        description: "You've joined the community."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/is-member`] });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/members`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
    } catch (error) {
      toast({
        title: "Failed to join",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user) return;

    try {
      await apiRequest("POST", `/api/communities/${id}/leave`, {});
      
      toast({
        title: "Left community",
        description: "You have successfully left the community."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/is-member`] });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/members`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
    } catch (error) {
      toast({
        title: "Failed to leave",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleVideoSaved = (blob: Blob, thumbnail?: Blob) => {
    setVideoBlob(blob);
    if (thumbnail) {
      setThumbnailBlob(thumbnail);
    }
    setIsRecording(false);
  };

  const handleUploadVideo = async () => {
    if (!videoBlob) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("video", videoBlob, "community-intro.webm");
      formData.append("communityId", id.toString());
      formData.append("isIntroVideo", "true");
      
      if (thumbnailBlob) {
        formData.append("thumbnailBlob", thumbnailBlob, "thumbnail.jpg");
      }
      
      // If not a member yet, join with this video
      if (!isMember) {
        formData.append("join", "true");
      }
      
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload video");
      }
      
      setVideoBlob(null);
      setThumbnailBlob(null);
      
      toast({
        title: isMember ? "Video updated" : "Joined community",
        description: isMember 
          ? "Your introduction video has been updated."
          : "You've joined the community with your introduction video."
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/is-member`] });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/community/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelVideo = () => {
    setVideoBlob(null);
    setThumbnailBlob(null);
    setIsRecording(false);
  };

  if (isCommunityLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!community) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Community Not Found</h2>
          <p className="text-gray-500 mb-6">The community you're looking for doesn't exist or has been removed.</p>
          <Link href="/communities">
            <Button>Browse Communities</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const creatorIsSelf = user?.id === community.creatorId;
  
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-heading font-bold text-gray-900">{community.name}</h2>
            <p className="text-gray-500">Created {formatDate(community.createdAt)}</p>
          </div>
          
          {user && !isCheckingMembership && (
            <div className="flex gap-2">
              {isMember ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsRecording(true)}
                    disabled={isRecording}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {userIntroVideo ? "Update Intro Video" : "Add Intro Video"}
                  </Button>
                  
                  {!creatorIsSelf && (
                    <Button
                      variant="destructive"
                      onClick={handleLeaveCommunity}
                    >
                      Leave Community
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowJoinWithVideo(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Join with Video
                  </Button>
                  
                  <Button
                    onClick={handleJoinCommunity}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Community
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Video Recording Modal */}
      {isRecording && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Record your introduction for this community</CardTitle>
            <CardDescription>
              Create a short video (up to 60 seconds) to introduce yourself to other members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoRecorder onVideoSaved={handleVideoSaved} maxDuration={60} />
          </CardContent>
        </Card>
      )}
      
      {/* Video Preview and Upload */}
      {videoBlob && !isRecording && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Review your video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video mb-4">
              <video 
                src={URL.createObjectURL(videoBlob)} 
                controls 
                className="w-full h-full rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancelVideo}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadVideo}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Save Video"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="w-full md:w-auto bg-gray-100 p-1">
          <TabsTrigger value="about" className="flex-1 md:flex-initial">
            About
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 md:flex-initial">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex-1 md:flex-initial">
            <Video className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About this Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{community.description}</p>
              
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Community Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-medium text-gray-500">Created</div>
                    <div className="sm:col-span-2 text-gray-900">{formatDate(community.createdAt)}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-medium text-gray-500">Members</div>
                    <div className="sm:col-span-2 text-gray-900">{members.length}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-medium text-gray-500">Creator</div>
                    <div className="sm:col-span-2 text-gray-900">
                      {members.find((m: any) => m.userId === community.creatorId)?.user?.displayName || "Unknown"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Community Members ({members.length})
            </h3>
          </div>
          
          {isMembersLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center">
                  <Users className="h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Yet</h3>
                  <p className="text-gray-500 mb-6">
                    This community doesn't have any members yet. Be the first to join!
                  </p>
                  {!isMember && user && (
                    <Button onClick={handleJoinCommunity}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Community
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {members.map((member: any) => (
                <Card key={member.id} className="overflow-hidden">
                  <div className="p-4 flex flex-col items-center">
                    <Link href={`/profile/${member.user.id}`}>
                      <a className="flex flex-col items-center">
                        <div className="relative">
                          <div className="mb-3">
                            <img 
                              src={member.user.avatarUrl || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(member.user.displayName)}`} 
                              alt={member.user.displayName}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          </div>
                          {member.introVideoUrl && (
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full">
                              <Video className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 text-center">
                          {member.user.displayName}
                        </h4>
                        <p className="text-sm text-gray-500 text-center">
                          @{member.user.username}
                        </p>
                      </a>
                    </Link>
                    
                    {member.introVideoUrl && (
                      <div className="mt-3 w-full">
                        <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                          <VideoPlayer
                            src={member.introVideoUrl}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-center space-x-2 w-full">
                      <Link href={`/profile/${member.user.id}`}>
                        <Button variant="outline" size="sm" className="flex-1">
                          Profile
                        </Button>
                      </Link>
                      
                      {user && user.id !== member.user.id && (
                        <Link href={`/messages/${member.user.id}`}>
                          <Button size="sm" className="flex-1">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Community Videos</h3>
          </div>
          
          {isVideosLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center">
                  <Video className="h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Videos Yet</h3>
                  <p className="text-gray-500">
                    This community doesn't have any videos yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video: any) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-gray-100">
                    <VideoPlayer
                      src={video.url}
                      poster={video.thumbnailUrl || undefined}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {video.title || "Untitled Video"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          By {members.find((m: any) => m.userId === video.userId)?.user?.displayName || "Unknown user"}
                        </p>
                      </div>
                      {video.isIntroVideo && (
                        <span className="bg-primary-100 text-primary text-xs px-2 py-1 rounded-full">
                          Intro
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(video.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
