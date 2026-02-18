<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "../utils/storage";
import { authService, User, LoginRequest } from "../services/auth.service";
=======
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService, User, LoginRequest } from '../services/auth.service';
>>>>>>> 4975e9f2 (commit)

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
<<<<<<< HEAD
  login: (
    credentials: LoginRequest,
  ) => Promise<{ success: boolean; message: string }>;
=======
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message: string }>;
>>>>>>> 4975e9f2 (commit)
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

<<<<<<< HEAD
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
=======
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
>>>>>>> 4975e9f2 (commit)
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getAccessToken();
      const savedUser = await storage.getUser();

      if (token && savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
<<<<<<< HEAD
      console.log("Auth check failed:", error);
=======
      console.error('Auth check failed:', error);
>>>>>>> 4975e9f2 (commit)
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
<<<<<<< HEAD

=======
>>>>>>> 4975e9f2 (commit)
        const { user, tokens } = response.data;

        await storage.saveTokens(tokens.access, tokens.refresh);
        await storage.saveUser(user);
<<<<<<< HEAD
        
        storage.getAccessToken().then((storedToken) => {
          console.log('Stored Access Token after login:', storedToken);
        }
        );

        console.log("Login successful, user:", user);
        console.log("Login successful, tokens:",tokens.access);
        console.log("Saved user in storage:", await storage.getUser());

        setUser(user);

        return { success: true, message: "Login successful" };
      }

      return { success: false, message: response.message || "Login failed" };
    } catch (error) {
      console.log("Login error:", error);
      return { success: false, message: "Network error. Please try again." };
=======
        setUser(user);

        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
>>>>>>> 4975e9f2 (commit)
    }
  };

  const logout = async () => {
    await storage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
<<<<<<< HEAD
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
=======
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
>>>>>>> 4975e9f2 (commit)
