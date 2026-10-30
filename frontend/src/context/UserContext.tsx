import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HealthStatus, User } from '../types';
import { getHealthStatus, getUserProfile, updateUserProfile as updateProfileApi } from '../services/api';

interface UserContextType {
  user: User | null;
  health: HealthStatus | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<User>;
  refreshHealth: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getHealthStatus();
      setHealth(data);
    } catch {
      // Backend may be offline or starting up
      setHealth(null);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const data = await getUserProfile();
      setUser(data);
    } catch (err) {
      console.warn('Could not fetch user profile yet:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([fetchHealth(), fetchUser()]);
      setLoading(false);
    };
    init();
  }, [fetchHealth, fetchUser]);

  const updateUser = async (data: Partial<User>): Promise<User> => {
    const updated = await updateProfileApi(data);
    setUser(updated);
    return updated;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        health,
        loading,
        refreshUser: fetchUser,
        updateUser,
        refreshHealth: fetchHealth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

