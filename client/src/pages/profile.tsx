import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Users, Video } from "lucide-react";
import UserAvatar from "@/components/ui/user-avatar";
import VideoPlayer from "@/components/ui/video-player";
import CommunityList from "@/components/communities/community-list";
import { formatDate } from "@/lib/utils";

type ProfileProps = {
  id: number;
};

export default function Profile({ id }: ProfileProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Fetch user data
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });
  
  // Fetch user communities
  const { data: userCommunities = [], isLoading: isCommunitiesLoading } = useQuery({
    queryKey: [`/api/user/communities/${id}`],
    enabled: !!id,
  });
  
  // Fetch user videos
  const { data: userVideos = [], isLoading: isVideosLoading } = useQuery({
    queryKey: [`/api/videos/user/${id}`],
    enabled: !!id,
  });
  
  const isOwnProfile = currentUser?.id === id;
  
  if (isUserLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-500">The user you're looking for doesn't exist or has been removed.</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="xl" />
            <div>
              <h2 className="text-2xl font-heading font-bold text-gray-900">{user.displayName}</h2>
              <p className="text-gray-500">@{user.username}</p>
            </div>
          </div>
          
          {isOwnProfile ? (
            <Link href="/edit-profile">
              <Button className="md:self-start">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </Link>
          ) : (
            <Link href={`/messages/${user.id}`}>
              <Button className="md:self-start">
                Message
              </Button>
            </Link>
          )}
        </div>
        
        {user.bio && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <p className="text-gray-700">{user.bio}</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="w-full md:w-auto bg-gray-100 p-1">
          <TabsTrigger value="profile" className="flex-1 md:flex-initial">
            <Video className="h-4 w-4 mr-2" />
            Introduction
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex-1 md:flex-initial">
            <Users className="h-4 w-4 mr-2" />
            Communities
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex-1 md:flex-initial">
            <Video className="h-4 w-4 mr-2" />
            Videos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          {user.introVideoUrl ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Introduction Video</CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoPlayer 
                    src={user.introVideoUrl} 
                    className="aspect-video rounded-md overflow-hidden"
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center max-w-md mx-auto">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Introduction Video</h3>
                  <p className="text-gray-500">
                    {isOwnProfile 
                      ? "Record an introduction video to tell others about yourself!"
                      : `${user.displayName} hasn't recorded an introduction video yet.`
                    }
                  </p>
                  
                  {isOwnProfile && (
                    <Link href="/edit-profile">
                      <Button className="mt-4">
                        Record Intro Video
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Display Name</h4>
                  <p className="text-gray-900">{user.displayName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Username</h4>
                  <p className="text-gray-900">@{user.username}</p>
                </div>
                {user.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Bio</h4>
                    <p className="text-gray-900">{user.bio}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Member Since</h4>
                  <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="communities" className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isOwnProfile ? "My Communities" : `${user.displayName}'s Communities`}
          </h3>
          
          <CommunityList 
            communities={userCommunities}
            isLoading={isCommunitiesLoading}
            emptyMessage={
              isOwnProfile 
                ? "You haven't joined any communities yet."
                : `${user.displayName} hasn't joined any communities yet.`
            }
          />
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isOwnProfile ? "My Videos" : `${user.displayName}'s Videos`}
          </h3>
          
          {isVideosLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userVideos.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center max-w-md mx-auto">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Videos</h3>
                  <p className="text-gray-500">
                    {isOwnProfile 
                      ? "You haven't uploaded any videos yet."
                      : `${user.displayName} hasn't uploaded any videos yet.`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {userVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    <VideoPlayer 
                      src={video.url} 
                      poster={video.thumbnailUrl || undefined}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-gray-900">{video.title || "Untitled Video"}</h4>
                    {video.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{formatDate(video.createdAt)}</p>
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
