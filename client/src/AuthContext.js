import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const snapshot = await db.ref(`users/${user.uid}`).once('value');
        const profile = snapshot.val();

        if (profile) {
          const userData = {
            uid: user.uid,
            email: user.email,
            name: profile.name,
            role: profile.role,
            token
          };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', token);
          setCurrentUser(userData);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const register = async (name, email, password, role) => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.ref(`users/${user.uid}`).set({
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    });

    const token = await user.getIdToken();
    localStorage.setItem('token', token);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const value = {
    currentUser,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};