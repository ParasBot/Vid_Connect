import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus, Users, Video } from "lucide-react";
import CommunityList from "@/components/communities/community-list";
import UserList from "@/components/users/user-list";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();

  // Get user communities
  const { data: userCommunities = [], isLoading: isCommunitiesLoading } = useQuery({
    queryKey: ["/api/user/communities"],
    enabled: !!user,
  });

  // Get popular communities
  const { data: popularCommunities = [], isLoading: isPopularLoading } = useQuery({
    queryKey: ["/api/communities?popular=true"],
    enabled: true,
  });

  // Get suggested users
  const { data: suggestedUsers = [], isLoading: isSuggestedUsersLoading } = useQuery({
    queryKey: ["/api/users?suggested=true"],
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      window.location.href = "/login";
    }
  }, [isAuthLoading, user]);

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome, {user.displayName}!
          </h2>
        </div>
        
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          <Link href="/search">
            <Button variant="outline" className="flex items-center">
              <UserPlus className="h-4 w-4 mr-2" />
              Find People
            </Button>
          </Link>
          
          <Link href="/create-community">
            <Button className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Community
            </Button>
          </Link>
        </div>
      </div>
      
      {/* User profile completion card (shown if user doesn't have intro video) */}
      {!user.introVideoUrl && (
        <Card className="mb-6 bg-primary-50 border-primary-100">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="flex items-start space-x-3">
                <div className="bg-primary-100 rounded-full p-2">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-gray-600">
                    Record an introduction video to help others get to know you better.
                  </p>
                </div>
              </div>
              
              <Link href="/edit-profile">
                <Button className="mt-4 md:mt-0">
                  Record Intro Video
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main content */}
      <Tabs defaultValue="communities" className="space-y-6">
        <TabsList className="w-full md:w-auto bg-gray-100 p-1">
          <TabsTrigger value="communities" className="flex-1 md:flex-initial">
            <Users className="h-4 w-4 mr-2" />
            Communities
          </TabsTrigger>
          <TabsTrigger value="people" className="flex-1 md:flex-initial">
            <UserPlus className="h-4 w-4 mr-2" />
            People to Connect
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="communities" className="space-y-6">
          {/* My Communities Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Communities</h3>
              <Link href="/communities">
                <Button variant="link">View All</Button>
              </Link>
            </div>
            
            <CommunityList
              communities={userCommunities.slice(0, 3)}
              isLoading={isCommunitiesLoading}
              emptyMessage="You haven't joined any communities yet."
            />
          </div>
          
          {/* Popular Communities Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Popular Communities</h3>
              <Link href="/communities">
                <Button variant="link">Explore More</Button>
              </Link>
            </div>
            
            <CommunityList
              communities={popularCommunities.slice(0, 3)}
              isLoading={isPopularLoading}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="people" className="space-y-6">
          {/* Suggested Users Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">People You Might Know</h3>
              <Link href="/search">
                <Button variant="link">Find More</Button>
              </Link>
            </div>
            
            <UserList
              users={suggestedUsers.slice(0, 4)}
              isLoading={isSuggestedUsersLoading}
              emptyMessage="No suggestions available at the moment."
            />
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
