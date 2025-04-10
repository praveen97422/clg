import { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
      
      // Verify admin status (you may want to move this to a backend API)
      const isAdmin = userData.email === 'havyajewellery@gmail.com';
      
      const userWithAuthData = {
        ...userData,
        isAdmin,
        token: idToken
      };
      
      localStorage.setItem(USER_KEY, JSON.stringify(userWithAuthData));
      setUser(userWithAuthData);
      setIsAuthenticated(true);
      setIsAdmin(isAdmin);
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
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin,
      loading,
      login, 
      logout 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  return useContext(AuthContext);
};

export { useAuth };
