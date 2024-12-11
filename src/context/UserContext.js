// // src/context/UserContext.js
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import auth from '@react-native-firebase/auth';

// // Create a context for managing user data globally
// const UserContext = createContext();

// // Custom hook to access user data
// export const useUser = () => {
//   return useContext(UserContext);
// };

// // UserProvider component that wraps your app and provides user context
// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null); // State for user information
//   const [isLoading, setIsLoading] = useState(true); // Loading state to show while fetching user data

//   // Effect hook to listen for changes in the authentication state
//   useEffect(() => {
//     const unsubscribe = auth().onAuthStateChanged((currentUser) => {
//       setUser(currentUser); // Update user state
//       setIsLoading(false); // Hide loading once auth state is checked
//     });

//     // Cleanup the subscription when the component unmounts
//     return () => unsubscribe();
//   }, []);

//   // Logout function to sign the user out
//   const logout = async () => {
//     try {
//       await auth().signOut();
//       setUser(null); // Reset the user state after logout
//     } catch (error) {
//       console.log('Error signing out: ', error);
//     }
//   };

//   return (
//     <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
//       {children} {/* Render the child components */}
//     </UserContext.Provider>
//   );
// };
