import React, { createContext, useContext, useState } from 'react'; 
// Create a Context for the user 
const UserContext = createContext(); 
// Create a provider component 
export const UserProvider = ({ children }) => { 
  const [user, setUser] = useState(null); // State to hold user data 
  const login = (userData) => { 
    setUser(userData); // Set user data on login 
  }; 
  const logout = () => { 
    setUser(null); // Clear user data on logout 
  }; 
  return ( 
    <UserContext.Provider value={{ user, login, logout }}> 
      {children} 
    </UserContext.Provider> 
  ); 
}; 
// Create a custom hook to use the UserContext 
export const useUser = () => { 
  return useContext(UserContext); 
};