import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface UserWithRole extends User {
  role?: 'jogador' | 'gm';
}

interface AuthContextType {
  currentUser: UserWithRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({ ...user, role: userData.role });
        } else {
          // Se o documento não existir, verifique se já existe um GM.
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('role', '==', 'gm'), limit(1));
          const querySnapshot = await getDocs(q);

          let role = 'jogador';
          if (querySnapshot.empty) {
            // Se não houver GMs, o primeiro usuário se torna GM.
            role = 'gm';
            console.log('Nenhum GM encontrado. O primeiro usuário foi definido como GM.');
          }

          const newUser = {
            uid: user.uid,
            email: user.email,
            role: role,
          };
          await setDoc(doc(db, 'users', user.uid), newUser);
          setCurrentUser({ ...user, role: role as 'jogador' | 'gm' });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
