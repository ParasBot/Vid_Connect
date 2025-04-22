import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon, Users } from "lucide-react";
import UserList from "@/components/users/user-list";
import CommunityList from "@/components/communities/community-list";
import { useAuth } from "@/hooks/use-auth";

export default function Search() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("people");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch users
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: [`/api/users?q=${encodeURIComponent(debouncedQuery)}`],
    enabled: activeTab === "people" && debouncedQuery.length >= 2,
  });
  
  // Fetch communities
  const { data: communities = [], isLoading: isCommunitiesLoading } = useQuery({
    queryKey: [`/api/communities?q=${encodeURIComponent(debouncedQuery)}`],
    enabled: activeTab === "communities" && debouncedQuery.length >= 2,
  });
  
  // Fetch membership data for communities to display member counts and joined status
  const { data: membershipData } = useQuery({
    queryKey: ["/api/communities/membership"],
    select: (data: any) => ({
      counts: data.counts || {},
      userMemberships: data.userMemberships || [],
    }),
    enabled: !!user,
    placeholderData: { counts: {}, userMemberships: [] },
  });
  
  // Handle search submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already triggered by the debounced query
  };
  
  return (
    <MainLayout>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Discover
          </h2>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3 text-gray-400 h-5 w-5" />
          <Input
            type="search"
            placeholder={`Search for ${activeTab === "people" ? "people" : "communities"}...`}
            className="pl-10 pr-20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            className="absolute right-1" 
            size="sm"
            disabled={searchQuery.length < 2}
          >
            Search
          </Button>
        </div>
      </form>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="people" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            People
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Communities
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="people">
          {debouncedQuery.length >= 2 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {isUsersLoading 
                    ? "Searching..." 
                    : `${users.length} ${users.length === 1 ? "person" : "people"} found for "${debouncedQuery}"`}
                </h3>
              </div>
              
              <UserList 
                users={users.filter((u: any) => u.id !== user?.id)} 
                isLoading={isUsersLoading}
                emptyMessage="No users found matching your search."
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full mx-auto w-fit mb-4">
                <SearchIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Search for People</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter at least 2 characters to search for users by name or username.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="communities">
          {debouncedQuery.length >= 2 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {isCommunitiesLoading 
                    ? "Searching..." 
                    : `${communities.length} ${communities.length === 1 ? "community" : "communities"} found for "${debouncedQuery}"`}
                </h3>
              </div>
              
              <CommunityList
                communities={communities}
                memberCounts={membershipData?.counts}
                userMemberships={membershipData?.userMemberships}
                isLoading={isCommunitiesLoading}
                emptyMessage="No communities found matching your search."
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 p-4 rounded-full mx-auto w-fit mb-4">
                <SearchIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Search for Communities</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Enter at least 2 characters to search for communities by name or description.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
