"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  company?: string;
  title?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  accredited: boolean;
  accreditedAt?: string;
  accreditationExpires?: string;
  investorType?: string;
}

interface User {
  id: string;
  email: string;
  role: 'INVESTOR' | 'MANAGER' | 'SERVICE_PROVIDER' | 'NEWS_MEMBER' | 'ADMIN' | 'SUPER_ADMIN';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  emailVerified: boolean;
  profile: UserProfile | null;
  serviceProvider?: {
    id: string;
    companyName: string;
    slug: string;
    tier: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; pending?: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  company?: string;
  title?: string;
  investorType?: string;
  fundType?: string;
  category?: string;
  phone?: string;
  website?: string;
  description?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch current user
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  // Register function
  const register = async (registerData: RegisterData): Promise<{ success: boolean; pending?: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        // If account is pending approval, don't set user - redirect to pending page
        if (data.data.pending) {
          // Redirect to pending page
          router.push(`/register/pending?email=${encodeURIComponent(registerData.email)}`);
          return { success: true, pending: true };
        }
        // Only set user if account is immediately approved (shouldn't happen with new flow)
        setUser(data.data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { allowedRoles?: string[]; redirectTo?: string } = {}
) {
  return function ProtectedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const { allowedRoles, redirectTo = '/login' } = options;

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(redirectTo);
      } else if (!isLoading && allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-slate-500">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}
