import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import VideoRecorder from "@/components/ui/video-recorder";
import VideoPlayer from "@/components/ui/video-player";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, Save, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form validation schema
const profileSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [videoUploadStatus, setVideoUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  // Redirect if not authenticated
  if (!user) {
    setLocation("/login");
    return null;
  }

  // Set up form with default values from user
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName || "",
      bio: user.bio || "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, values);
      const updatedUser = await response.json();
      
      // Update auth context with new user data
      login({ ...user, ...updatedUser });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle video recording
  const handleVideoSaved = (recordedVideoBlob: Blob, recordedThumbnailBlob?: Blob) => {
    setVideoBlob(recordedVideoBlob);
    if (recordedThumbnailBlob) {
      setThumbnailBlob(recordedThumbnailBlob);
    }
    setRecordingVideo(false);
  };

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!videoBlob) return;
    
    setVideoUploadStatus("uploading");
    
    try {
      const formData = new FormData();
      formData.append("video", videoBlob, "intro-video.webm");
      formData.append("isIntroVideo", "true");
      
      if (thumbnailBlob) {
        formData.append("thumbnailBlob", thumbnailBlob, "thumbnail.jpg");
      }
      
      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload video");
      }
      
      const videoData = await response.json();
      
      // Update user context with new video URL
      login({ 
        ...user, 
        introVideoUrl: videoData.url 
      });
      
      setVideoUploadStatus("success");
      
      toast({
        title: "Video uploaded",
        description: "Your introduction video has been uploaded successfully.",
      });
    } catch (error) {
      setVideoUploadStatus("error");
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video.",
        variant: "destructive",
      });
    }
  };

  const handleCancelVideo = () => {
    setVideoBlob(null);
    setThumbnailBlob(null);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Edit Profile
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="video">Introduction Video</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <UserAvatar user={user} size="lg" />
                <div>
                  <h4 className="font-medium text-gray-900">@{user.username}</h4>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name as shown to others" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell others about yourself"
                            className="resize-none h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Introduction Video</CardTitle>
            </CardHeader>
            <CardContent>
              {user.introVideoUrl && !recordingVideo && !videoBlob && (
                <div className="mb-6">
                  <Alert className="mb-4">
                    <AlertTitle>You already have an introduction video</AlertTitle>
                    <AlertDescription>
                      Recording a new video will replace your current one. You can view your current video below.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="max-w-2xl mx-auto mb-4">
                    <VideoPlayer 
                      src={user.introVideoUrl} 
                      className="aspect-video rounded-md overflow-hidden" 
                    />
                  </div>
                </div>
              )}

              {!recordingVideo && !videoBlob ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Camera className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-center mb-2">Record an Introduction Video</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                    Create a short video introducing yourself to the community. Keep it under 60 seconds.
                  </p>
                  <Button onClick={() => setRecordingVideo(true)}>
                    Start Recording
                  </Button>
                </div>
              ) : recordingVideo ? (
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-medium mb-4">Recording Your Introduction</h3>
                  <VideoRecorder onVideoSaved={handleVideoSaved} maxDuration={60} />
                </div>
              ) : videoBlob ? (
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg font-medium mb-4">Preview Your Recording</h3>
                  <div className="mb-4">
                    <video 
                      src={URL.createObjectURL(videoBlob)} 
                      className="w-full aspect-video rounded-md" 
                      controls 
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button variant="outline" onClick={handleCancelVideo}>
                      <X className="h-4 w-4 mr-2" />
                      Discard
                    </Button>
                    <Button 
                      onClick={handleVideoUpload}
                      disabled={videoUploadStatus === "uploading"}
                    >
                      {videoUploadStatus === "uploading" ? "Uploading..." : "Save Video"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
