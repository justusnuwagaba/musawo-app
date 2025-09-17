import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate fetching user data
    const fetchUserData = async () => {
      try {
        // Simulate API call
        const response = await fetch('/api/user'); // Replace with your API endpoint
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const logout = () => {
    // Handle logout logic
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </UserContext.Provider>
  );
};