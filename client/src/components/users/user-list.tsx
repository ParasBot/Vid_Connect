import UserCard from "./user-card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type User = {
  id: number;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  introVideoUrl?: string | null;
};

type UserListProps = {
  users: User[];
  isLoading?: boolean;
  emptyMessage?: string;
  showActions?: boolean;
};

export default function UserList({
  users,
  isLoading = false,
  emptyMessage = "No users found",
  showActions = true
}: UserListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Alert className="bg-gray-50 border border-gray-200">
        <AlertDescription>
          {emptyMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
