import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Users } from "lucide-react";
import CommunityList from "@/components/communities/community-list";
import { useAuth } from "@/hooks/use-auth";

export default function Communities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  
  // Get all communities for discovery
  const { data: allCommunities = [], isLoading: isAllLoading } = useQuery({
    queryKey: ["/api/communities"],
    enabled: activeTab === "discover",
  });
  
  // Get user's joined communities
  const { data: userCommunities = [], isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user/communities"],
    enabled: !!user && activeTab === "my-communities",
  });
  
  // Search communities
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: [`/api/communities?q=${encodeURIComponent(searchQuery)}`],
    enabled: !!searchQuery && searchQuery.length >= 2,
  });
  
  // Get membership data for communities to display member counts and joined status
  const { data: membershipData } = useQuery({
    queryKey: ["/api/communities/membership"],
    select: (data: any) => ({
      counts: data.counts || {},
      userMemberships: data.userMemberships || [],
    }),
    enabled: !!user,
    placeholderData: { counts: {}, userMemberships: [] },
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already triggered by the useQuery hook when searchQuery changes
  };
  
  const handleJoinLeaveSuccess = () => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
    queryClient.invalidateQueries({ queryKey: ["/api/communities/membership"] });
  };
  
  // Decide which communities to display
  const displayedCommunities = searchQuery.length >= 2 
    ? searchResults 
    : activeTab === "my-communities" 
      ? userCommunities 
      : allCommunities;
  
  return (
    <MainLayout>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Communities
          </h2>
        </div>
        
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link href="/create-community">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </Link>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="search"
            placeholder="Search communities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>
      
      {!searchQuery && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="discover" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my-communities" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              My Communities
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      {searchQuery && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {searchResults.length} results for "{searchQuery}"
          </h3>
        </div>
      )}
      
      <CommunityList
        communities={displayedCommunities}
        memberCounts={membershipData?.counts}
        userMemberships={membershipData?.userMemberships}
        isLoading={
          (activeTab === "discover" && isAllLoading) ||
          (activeTab === "my-communities" && isUserLoading) ||
          (searchQuery.length >= 2 && isSearching)
        }
        onJoinLeaveSuccess={handleJoinLeaveSuccess}
      />
    </MainLayout>
  );
}
