import { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React from 'react';
import { BASE_URL } from "../apiConfig.js";

const AuthContext = createContext();
const USER_KEY = 'auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize from localStorage if available
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      return {
        ...userData,
        isAdmin: userData.email === 'havyajewellery@gmail.com'
      };
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin || false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const userData = {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            picture: firebaseUser.photoURL,
            isAdmin: firebaseUser.email === 'havyajewellery@gmail.com',
            token: idToken
          };
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setUser(userData);
          setIsAuthenticated(true);
          setIsAdmin(userData.isAdmin);
        } catch (error) {
          console.error('Auth state error:', error);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (userData) => {
    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser.getIdToken();

      // Fetch user profile from backend to check if new user
      const response = await fetch(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to fetch user profile');
      }

      const isAdmin = userData.email === 'havyajewellery@gmail.com';
      const userWithAuthData = {
        ...userData,
        uid: auth.currentUser.uid,
        isAdmin,
        token: idToken,
        isNewUser: data.isNewUser,
        profile: data.user
      };

      localStorage.setItem(USER_KEY, JSON.stringify(userWithAuthData));
      setUser(userWithAuthData);
      setIsAuthenticated(true);
      setIsAdmin(isAdmin);
      return userWithAuthData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsAuthenticated(false);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };



  const updateUserProfile = async (profileData) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }
      const data = await response.json();
      // Update user state with new profile data
      setUser(prevUser => ({
        ...prevUser,
        ...profileData
      }));
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin,
      loading,
      login, 
      logout,
      updateUserProfile
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  return useContext(AuthContext);
};

export { useAuth };
