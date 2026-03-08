import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAccessToken,
  fetchCurrentProfile,
  logout as apiLogout,
} from "@/services/api";
import type { ProfileDto, UserDto } from "@/services/api.types";

interface AuthContextType {
  user: UserDto | null;
  profile: ProfileDto | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAuthData: (user: UserDto, profile: ProfileDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!getAccessToken();

  const loadProfile = async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const profileData = await fetchCurrentProfile();
      setProfile(profileData);
      setUser({ id: profileData.user_id, email: "" }); // Email not needed for display
    } catch {
      // Token invalid or expired
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const signOut = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (getAccessToken()) {
      try {
        const profileData = await fetchCurrentProfile();
        setProfile(profileData);
      } catch {
        // Ignore errors
      }
    }
  };

  const setAuthData = (newUser: UserDto, newProfile: ProfileDto) => {
    setUser(newUser);
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated,
        signOut,
        refreshProfile,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
