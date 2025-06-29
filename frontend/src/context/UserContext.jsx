import { createContext, useState, useContext, useEffect } from 'react';

// Create context
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  return useContext(UserContext);
};

// Helper to check if running in Electron
const isRunningInElectron = () => {
  return window.api && window.api.isElectron === true;
};

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Check if we're running in Electron
        if (isRunningInElectron()) {
          // Load from Electron store
          const userData = await window.api.getUserData();
          if (userData) {
            setUser(userData);
            setIsLoggedIn(true);
          }
        } else {
          // Fallback to localStorage for web
          const storedUser = localStorage.getItem('userData');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsLoggedIn(true);
            } catch (error) {
              console.error('Failed to parse user data from localStorage:', error);
              localStorage.removeItem('userData');
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Login function
  const login = async (userData) => {
    try {
      // Store the user data
      if (isRunningInElectron()) {
        // Store in Electron store
        await window.api.setUserData(userData);
      } else {
        // Fallback to localStorage for web
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // Update state
      setUser(userData);
      setIsLoggedIn(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (isRunningInElectron()) {
        // Clear from Electron store
        await window.api.clearUserData();
      } else {
        // Clear from localStorage
        localStorage.removeItem('userData');
      }
      
      // Update state
      setUser(null);
      setIsLoggedIn(false);
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  // Value object to be provided to consumers
  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 