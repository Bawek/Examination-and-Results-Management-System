import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role;
  isAuthenticated: boolean;
  studentProfile: any | null;
  teacherProfile: any | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const meData = await api.getMe().catch(() => null);

      if (meData && meData.user) {
        setCurrentUser(meData.user);
        setCurrentRole(meData.user.role);
        setStudentProfile(meData.student || null);
        setTeacherProfile(meData.teacher || null);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Error fetching auth session:', err);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Any API call that comes back 401 means the session is gone: return to login.
  useEffect(() => {
    const onUnauthorized = () => {
      setCurrentUser(null);
      setStudentProfile(null);
      setTeacherProfile(null);
    };
    window.addEventListener('ierms:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ierms:unauthorized', onUnauthorized);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    if (res && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      await fetchSession();
      return res.user;
    }
    throw new Error(res.error || 'Authentication failed');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    }
    setCurrentUser(null);
    setStudentProfile(null);
    setTeacherProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated: !!currentUser,
        studentProfile,
        teacherProfile,
        login,
        logout,
        refreshProfile: fetchSession,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
