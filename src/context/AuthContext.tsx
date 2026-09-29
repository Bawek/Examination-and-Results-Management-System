import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  currentUser: User | null;
  currentRole: Role;
  usersList: User[];
  studentProfile: any | null;
  teacherProfile: any | null;
  switchRole: (role: Role, userId?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>(() => {
    return (localStorage.getItem('ierms_active_role') as Role) || 'admin';
  });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const [meData, usersData] = await Promise.all([
        api.getMe().catch(() => null),
        api.getUsersList().catch(() => [])
      ]);

      if (meData && meData.user) {
        setCurrentUser(meData.user);
        setCurrentRole(meData.user.role);
        setStudentProfile(meData.student || null);
        setTeacherProfile(meData.teacher || null);
      }
      setUsersList(usersData || []);
    } catch (err) {
      console.error('Error fetching auth session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

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
        usersList,
        studentProfile,
        teacherProfile,
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
