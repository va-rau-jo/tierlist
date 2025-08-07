'use client';

import React, { createContext, useContext, useRef, useCallback, ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from './FirebaseProvider';
import { FirebaseReturnStatus } from '@/app/firebase/firebase_utils';

interface UserNamesContextType {
	getUserName: (userId: string) => string | FirebaseReturnStatus;
	fetchUserName: (userId: string) => Promise<string | FirebaseReturnStatus>;
}

const UserNamesContext = createContext<UserNamesContextType | undefined>(undefined);

interface UserNamesProviderProps {
	children: ReactNode;
}

export const UserNamesProvider: React.FC<UserNamesProviderProps> = ({ children }) => {
	const { db } = useFirebase();

	// Use useRef for the actual map to prevent re-renders on every map update
	const userNamesMapRef = useRef<Map<string, string>>(new Map());

	// Gets the userId from the username map, or returns user not found error.
	const getUserIdFromMap = (userId: string): string | FirebaseReturnStatus => {
		return userNamesMapRef.current.get(userId) || FirebaseReturnStatus.USER_NOT_FOUND_ERROR;
	};

	const getUserName = useCallback((userId: string): string | FirebaseReturnStatus => {
		return getUserIdFromMap(userId);
	}, []);

	// Function to fetch a name and add it to the cache
	const fetchUserName = useCallback(
		async (userId: string): Promise<string | FirebaseReturnStatus> => {
			if (!userId || !db) return FirebaseReturnStatus.USER_NOT_FOUND_ERROR;

			// Check if already in cache
			if (userNamesMapRef.current.has(userId)) {
				return getUserIdFromMap(userId);
			}

			const userDoc = doc(db, `users/${userId}/publicProfile/details`);
			const docSnap = await getDoc(userDoc);

			if (!docSnap.exists()) {
				return FirebaseReturnStatus.USER_NOT_FOUND_ERROR;
			}

			const name = docSnap.data()?.name;
			userNamesMapRef.current.set(userId, name);
			return name;
		},
		[db]
	);

	const contextValue = {
		getUserName,
		fetchUserName,
	};

	return <UserNamesContext.Provider value={contextValue}>{children}</UserNamesContext.Provider>;
};

// Custom hook to consume the context easily
export const useUserNames = () => {
	const context = useContext(UserNamesContext);
	if (context === undefined) {
		throw new Error('useUserNames must be used within a UserNamesProvider');
	}
	return context;
};
