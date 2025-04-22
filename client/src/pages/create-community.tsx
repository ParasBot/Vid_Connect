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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

// Form validation schema
const communitySchema = z.object({
  name: z.string().min(3, {
    message: "Community name must be at least 3 characters.",
  }).max(50, {
    message: "Community name must be less than 50 characters."
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  coverImageUrl: z.string().url({
    message: "Please enter a valid URL for the cover image.",
  }).optional().or(z.literal('')),
});

type CommunityFormValues = z.infer<typeof communitySchema>;

export default function CreateCommunity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    setLocation("/login");
    return null;
  }

  // Set up form
  const form = useForm<CommunityFormValues>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      description: "",
      coverImageUrl: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: CommunityFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/communities", {
        ...values,
        creatorId: user.id,
      });
      
      const newCommunity = await response.json();
      
      toast({
        title: "Community created",
        description: `Your community "${newCommunity.name}" has been created successfully.`,
      });
      
      // Redirect to the new community page
      setLocation(`/communities/${newCommunity.id}`);
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create community.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => setLocation("/communities")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-2xl font-heading font-bold leading-7 text-gray-900">
          Create a New Community
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name for your community" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a clear, descriptive name that reflects the purpose of your community.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what your community is about"
                        className="resize-none h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Explain the purpose and focus of your community to help others decide if they want to join.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/your-image.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add an image URL to represent your community. Leave blank to use a default image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
