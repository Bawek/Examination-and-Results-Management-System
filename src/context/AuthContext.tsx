import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role;
  isAuthenticated: boolean;
  usersList: User[];
  studentProfile: any | null;
  teacherProfile: any | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  switchRole: (role: Role, userId?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('admin');
  const [usersList, setUsersList] = useState<User[]>([]);
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
        localStorage.setItem('ierms_active_role', meData.user.role);
        localStorage.setItem('ierms_active_user_id', meData.user.id.toString());
      } else {
        setCurrentUser(null);
      }

      const usersData = await api.getUsersList().catch(() => []);
      setUsersList(usersData || []);
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

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    if (res && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      localStorage.setItem('ierms_active_role', res.user.role);
      localStorage.setItem('ierms_active_user_id', res.user.id.toString());
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
    localStorage.removeItem('ierms_active_role');
    localStorage.removeItem('ierms_active_user_id');
  };

  const switchRole = async (role: Role, userId?: number) => {
    localStorage.setItem('ierms_active_role', role);
    if (userId) {
      localStorage.setItem('ierms_active_user_id', userId.toString());
    } else {
      localStorage.removeItem('ierms_active_user_id');
    }
    setCurrentRole(role);
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated: !!currentUser,
        usersList,
        studentProfile,
        teacherProfile,
        login,
        logout,
        switchRole,
        refreshProfile: fetchSession,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
