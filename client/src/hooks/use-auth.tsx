import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type User = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  introVideoUrl?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Fetch current user
  const { data, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
    onError: () => {
      // Clear user if unauthorized
      setUser(null);
    },
  });

  // Update user state when data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  // Login function
  const login = (userData: User) => {
    setUser(userData);
    queryClient.setQueryData(['/api/auth/me'], userData);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
