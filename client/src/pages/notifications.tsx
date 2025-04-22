import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, Check, Loader2, MessageCircle, UserPlus, Users } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  
  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000,
  });
  
  const unreadCount = notifications.filter((notification: any) => !notification.read).length;
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-6 w-6 text-primary" />;
      case 'community_join':
        return <UserPlus className="h-6 w-6 text-green-500" />;
      case 'community_invite':
        return <Users className="h-6 w-6 text-blue-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  };
  
  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'message':
        // Assuming relatedId contains the sender's ID for messages
        return `/messages/${notification.relatedId}`;
      case 'community_join':
      case 'community_invite':
        // Assuming relatedId contains the community ID
        return `/communities/${notification.relatedId}`;
      default:
        return '#';
    }
  };
  
  const handleMarkAsRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/notifications/${id}/read`, {});
      
      // Update the cache
      queryClient.setQueryData(['/api/notifications'], (oldData: any) => 
        oldData.map((notification: any) => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    setIsMarkingAllRead(true);
    try {
      await apiRequest("POST", "/api/notifications/read-all", {});
      
      // Update the cache - mark all as read
      queryClient.setQueryData(['/api/notifications'], (oldData: any) => 
        oldData.map((notification: any) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <MainLayout>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Notifications
          </h2>
        </div>
        
        {unreadCount > 0 && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark all as read
            </Button>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <BellOff className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                You don't have any notifications yet. Join communities and connect with others to stay updated.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: any) => (
            <Card 
              key={notification.id} 
              className={`overflow-hidden transition-colors ${!notification.read ? 'bg-primary-50 border-primary-100' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex">
                  <div className="mr-4">
                    <div className={`p-2 rounded-full ${!notification.read ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center ml-4">
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="mr-2"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Link href={getNotificationLink(notification)}>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (!notification.read) {
                                handleMarkAsRead(notification.id);
                              }
                            }}
                          >
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
