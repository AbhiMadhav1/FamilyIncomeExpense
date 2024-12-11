import React, { createContext, useContext, useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Additional user data from Firestore
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch additional user data from Firestore
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          setUserData(userDoc.data());
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.log('Error signing out: ', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, userData, setUser, setUserData, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
