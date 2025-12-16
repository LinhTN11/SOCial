import { create } from 'zustand';
import { User } from '../types';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    checkAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    checkAuth: async () => {
        set({ isLoading: true });

        // Safety timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if (useAuthStore.getState().isLoading) {
                console.warn('Auth check timed out, falling back to unauthenticated state');
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        }, 5000); // 5 seconds timeout

        onAuthStateChanged(auth, async (firebaseUser) => {
            clearTimeout(timeoutId);
            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        set({ user: userDoc.data() as User, isAuthenticated: true, isLoading: false });
                    } else {
                        // Handle case where user exists in Auth but not Firestore (shouldn't happen ideally)
                        console.warn('User document not found in Firestore');
                        set({ user: null, isAuthenticated: false, isLoading: false });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            } else {
                set({ user: null, isAuthenticated: false, isLoading: false });
            }
        });
    },
    logout: async () => {
        try {
            await signOut(auth);
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
}));
