'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
	getAuth,
	signInWithPopup,
	signOut,
	GoogleAuthProvider,
	User as FirebaseAuthUser,
} from 'firebase/auth';

import {
	getFirestore,
	doc,
	getDoc,
	setDoc,
	onSnapshot,
	collection,
	query,
	addDoc,
} from 'firebase/firestore';

// Define Firebase configuration and app ID (will be provided by the environment)
const firebaseConfig = {
	apiKey: 'AIzaSyD1NqHWG8BtG9wIdl52mANjbkN7-SZQ1cg',
	authDomain: 'tierlist-d2262.firebaseapp.com',
	projectId: 'tierlist-d2262',
	storageBucket: 'tierlist-d2262.firebasestorage.app',
	messagingSenderId: '1062431917269',
	appId: '1:1062431917269:web:151025d05c40d80f044e5c',
	measurementId: 'G-3DETWEXJ5Q',
};
const appId = firebaseConfig.appId;
const initialAuthToken = null;
const googleProvider = new GoogleAuthProvider(); // Export Google Auth Provider

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Type Definitions
interface TierItemData {
	id: string;
	name: string;
	imageUrl: string;
	averageScore?: string; // Optional for average view mode
}

interface TierDefinition {
	id: string;
	name: string;
	color: string;
	value: number;
}

interface UserRatings {
	[itemId: string]: string; // itemId maps to tierId
}

interface TierListData {
	name: string;
	items: TierItemData[];
	ownerId: string;
	createdAt: Date;
}

interface AllUserRatings {
	[userId: string]: UserRatings;
}

// Tier definitions with associated colors and numerical values for averaging
const TIERS: TierDefinition[] = [
	{ id: 'S', name: 'S', color: '#ff7f7f', value: 5 }, // Red
	{ id: 'A', name: 'A', color: '#ffbf7f', value: 4 }, // Orange
	{ id: 'B', name: 'B', color: '#ffff7f', value: 3 }, // Yellow
	{ id: 'C', name: 'C', color: '#a8ff7f', value: 2 }, // Light Green
	{ id: 'D', name: 'D', color: '#7fbfff', value: 1 }, // Light Blue
	{ id: 'F', name: 'F', color: '#bf7fff', value: 0 }, // Purple
];

// Helper to map numerical value back to tier ID for display
const valueToTierId = (value: number): string => {
	if (value >= 4.5) return 'S';
	if (value >= 3.5) return 'A';
	if (value >= 2.5) return 'B';
	if (value >= 1.5) return 'C';
	if (value >= 0.5) return 'D';
	return 'F';
};

// Main App Component
const App: React.FC = () => {
	const [user, setUser] = useState<FirebaseAuthUser | null>(null);
	const [userId, setUserId] = useState<string>('loading...');
	const [currentTierListId, setCurrentTierListId] = useState<string>('');
	const [tierListName, setTierListName] = useState<string>('');
	const [tierListItems, setTierListItems] = useState<TierItemData[]>([]);
	const [userRatings, setUserRatings] = useState<UserRatings>({});
	const [allUserRatings, setAllUserRatings] = useState<AllUserRatings>({});
	const [viewMode, setViewMode] = useState<'personal' | 'average' | 'user_id'>('personal');
	const [selectedViewingUserId, setSelectedViewingUserId] = useState<string>('');
	const [message, setMessage] = useState<string>('');

	// Firestore path constants
	const getTierListsCollectionRef = () =>
		collection(db, `artifacts/${appId}/public/data/tierLists`);
	const getUserRatingsCollectionRef = (tierListId: string) =>
		collection(db, `artifacts/${appId}/public/data/userRatings`);

	// Effect for Firebase Authentication
	// useEffect(() => {
	// 	const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
	// 		if (currentUser) {
	// 			setUser(currentUser);
	// 			setUserId(currentUser.uid);
	// 		} else {
	// 			try {
	// 				if (initialAuthToken) {
	// 					console.log('Signing back in');
	// 					await signInWithCustomToken(auth, initialAuthToken);
	// 				} else {
	// 					console.log('Signing in anonymously');
	// 					await signInAnonymously(auth);
	// 				}
	// 			} catch (error) {
	// 				console.error('Error signing in:', error);
	// 				setMessage('Authentication failed. Please try again.');
	// 			}
	// 		}
	// 	});
	// 	return () => unsubscribe();
	// }, []);

	// Effect to listen for changes to the current user's ratings
	useEffect(() => {
		if (!user || !currentTierListId) return;

		const userRatingDocRef = doc(getUserRatingsCollectionRef(currentTierListId), user.uid);
		const unsubscribe = onSnapshot(
			userRatingDocRef,
			(docSnap) => {
				if (docSnap.exists()) {
					setUserRatings(docSnap.data().ratings || {});
				} else {
					setUserRatings({});
				}
			},
			(error) => {
				console.error('Error listening to user ratings:', error);
				setMessage('Failed to load your ratings.');
			}
		);
		return () => unsubscribe();
	}, [user, currentTierListId]);

	// Effect to listen for all user ratings for the current tier list
	useEffect(() => {
		if (!currentTierListId) {
			setAllUserRatings({});
			return;
		}

		const q = query(getUserRatingsCollectionRef(currentTierListId));
		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const allRatings: AllUserRatings = {};
				snapshot.forEach((docSnap) => {
					allRatings[docSnap.id] = (docSnap.data().ratings || {}) as UserRatings;
				});
				setAllUserRatings(allRatings);
			},
			(error) => {
				console.error('Error listening to all user ratings:', error);
				setMessage('Failed to load all user ratings.');
			}
		);
		return () => unsubscribe();
	}, [currentTierListId]);

	// Handles dropping an item into a tier
	const handleDrop = useCallback(
		async (itemId: string, tierId: string) => {
			if (viewMode !== 'personal' || !user) {
				setMessage('You can only drag and drop in your personal view.');
				return;
			}

			const newUserRatings = { ...userRatings, [itemId]: tierId };
			setUserRatings(newUserRatings);

			try {
				const userRatingDocRef = doc(getUserRatingsCollectionRef(currentTierListId), user.uid);
				await setDoc(
					userRatingDocRef,
					{ tierListId: currentTierListId, userId: user.uid, ratings: newUserRatings },
					{ merge: true }
				);
				setMessage('Rating saved successfully!');
			} catch (error) {
				console.error('Error saving rating:', error);
				setMessage('Failed to save rating.');
				setUserRatings(userRatings);
			}
		},
		[user, userRatings, currentTierListId, viewMode]
	);

	// Creates a new tier list
	const createNewTierList = async () => {
		if (!user) {
			setMessage('Please wait for authentication to complete.');
			return;
		}
		const name = prompt('Enter a name for your new tier list:');
		if (!name) return;

		const itemsInput = prompt(
			"Enter initial items for the tier list (comma-separated, e.g., 'Item A, Item B'):"
		);
		const parsedItems: TierItemData[] = itemsInput
			? itemsInput.split(',').map((item) => ({
					id: crypto.randomUUID(),
					name: item.trim(),
					imageUrl: `https://placehold.co/100x100/A8FF7F/000000?text=${encodeURIComponent(
						item.trim().substring(0, 10)
					)}`,
			  }))
			: [];

		try {
			const docRef = await addDoc(getTierListsCollectionRef(), {
				name: name,
				items: parsedItems,
				ownerId: user.uid,
				createdAt: new Date(),
			} as TierListData); // Cast to TierListData to ensure type safety
			setCurrentTierListId(docRef.id);
			setTierListName(name);
			setTierListItems(parsedItems);
			setMessage(`New tier list "${name}" created with ID: ${docRef.id}`);
			setViewMode('personal');
		} catch (error) {
			console.error('Error creating tier list:', error);
			setMessage('Failed to create tier list.');
		}
	};

	// Joins an existing tier list by ID
	const joinTierList = async () => {
		const id = prompt('Enter the Tier List ID to join:');
		if (!id) return;

		try {
			const docRef = doc(getTierListsCollectionRef(), id);
			const docSnap = await getDoc(docRef);
			if (docSnap.exists()) {
				const data = docSnap.data() as TierListData; // Cast data to TierListData
				setCurrentTierListId(id);
				setTierListName(data.name);
				setTierListItems(data.items || []);
				setMessage(`Joined tier list "${data.name}".`);
				setViewMode('personal');
			} else {
				setMessage('Tier List not found.');
			}
		} catch (error) {
			console.error('Error joining tier list:', error);
			setMessage('Failed to join tier list.');
		}
	};

	// Calculate items for display based on current view mode
	const getItemsForDisplay = useCallback(() => {
		const itemsGroupedByTier: { [key: string]: TierItemData[] } = TIERS.reduce(
			(acc, tier) => ({ ...acc, [tier.id]: [] }),
			{}
		);
		itemsGroupedByTier['unranked'] = [];

		if (viewMode === 'personal' && user) {
			tierListItems.forEach((item) => {
				const assignedTier = userRatings[item.id] || 'unranked';
				itemsGroupedByTier[assignedTier].push(item);
			});
		} else if (viewMode === 'average') {
			const itemScores: { [itemId: string]: number } = {};
			const itemCounts: { [itemId: string]: number } = {};

			Object.values(allUserRatings).forEach((singleUserRatings) => {
				for (const itemId in singleUserRatings) {
					const tierId = singleUserRatings[itemId];
					const tierValue = TIERS.find((t) => t.id === tierId)?.value;
					if (tierValue !== undefined) {
						itemScores[itemId] = (itemScores[itemId] || 0) + tierValue;
						itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
					}
				}
			});

			tierListItems.forEach((item) => {
				if (itemCounts[item.id]) {
					const averageScore = itemScores[item.id] / itemCounts[item.id];
					const averageTierId = valueToTierId(averageScore);
					itemsGroupedByTier[averageTierId].push({
						...item,
						averageScore: averageScore.toFixed(2),
					});
				} else {
					itemsGroupedByTier['unranked'].push(item);
				}
			});
		} else if (viewMode !== 'personal' && selectedViewingUserId) {
			const specificUserRatings = allUserRatings[selectedViewingUserId] || {};
			tierListItems.forEach((item) => {
				const assignedTier = specificUserRatings[item.id] || 'unranked';
				itemsGroupedByTier[assignedTier].push(item);
			});
		} else {
			tierListItems.forEach((item) => {
				itemsGroupedByTier['unranked'].push(item);
			});
		}

		return itemsGroupedByTier;
	}, [viewMode, user, userRatings, allUserRatings, tierListItems, selectedViewingUserId]);

	const handleSignUp = async (email: string, password: string) => {
		try {
			const auth = getAuth(); // Get the auth instance
			const userCredential = await signInWithPopup(auth, googleProvider);
			// Signed up successfully!
			const user = userCredential.user;
			console.log('User signed up:', user.email);
			// You can now redirect the user or update your app state
		} catch (error) {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.error('Error signing up:', errorCode, errorMessage);
			// Handle specific errors (e.g., email already in use)
		}
	};

	const itemsForDisplay = getItemsForDisplay();

	const ratedUserIds = Object.keys(allUserRatings).filter((id) => id !== user?.uid);

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 p-6 font-inter text-gray-800'>
			{/* Header and User Info */}
			<div className='mb-8 p-4 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4'>
				<h1 className='text-4xl font-bold text-purple-700'>Tier List App</h1>
				<div className='flex items-center text-lg'>
					<span className='font-semibold mr-2'>Your User ID:</span>
					<span className='text-blue-600'>{userId}</span>
				</div>
				<div>
					<button
						className='bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75'
						onClick={() => handleSignUp('test@example.com', 'password123')}
					>
						Sign Up
					</button>
				</div>
			</div>

			{/* Message Area */}
			{message && (
				<div className='mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg shadow-md flex items-center justify-between'>
					<span>{message}</span>
					<button
						onClick={() => setMessage('')}
						className='text-yellow-600 hover:text-yellow-900 font-bold ml-4'
					>
						&times;
					</button>
				</div>
			)}

			{/* Tier List Management */}
			<div className='mb-8 p-6 bg-white rounded-xl shadow-lg'>
				<h2 className='text-2xl font-semibold mb-4 text-purple-600'>Manage Tier Lists</h2>
				<div className='flex flex-wrap gap-4 mb-4'>
					<button
						onClick={createNewTierList}
						className='bg-purple-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-purple-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75'
					>
						Create New Tier List
					</button>
					<button
						onClick={joinTierList}
						className='bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75'
					>
						Join Existing Tier List
					</button>
				</div>
				{currentTierListId && (
					<div className='mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200'>
						<h3 className='text-xl font-medium text-purple-700'>
							Current Tier List: <span className='font-bold'>{tierListName}</span>
						</h3>
						<p className='text-purple-600 mt-1'>
							ID:{' '}
							<span className='font-mono bg-purple-200 px-2 py-1 rounded-md text-sm'>
								{currentTierListId}
							</span>
						</p>
					</div>
				)}
			</div>

			{/* Tier List Display */}
			{currentTierListId && (
				<div className='bg-white rounded-xl shadow-lg p-6'>
					<h2 className='text-3xl font-bold mb-6 text-center text-purple-700'>{tierListName}</h2>

					{/* View Mode Selector */}
					<div className='mb-6 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-purple-50 rounded-xl shadow-inner'>
						<span className='text-lg font-semibold text-purple-700'>Viewing Mode:</span>
						<select
							value={viewMode}
							onChange={(e) => {
								setViewMode(e.target.value as 'personal' | 'average' | 'user_id');
								setSelectedViewingUserId('');
							}}
							className='p-3 border border-purple-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors'
						>
							<option value='personal'>My Ratings</option>
							<option value='average'>Average Ratings</option>
							{ratedUserIds.length > 0 && (
								<option value='user_id'>Other User&apos;s Ratings</option>
							)}
						</select>

						{viewMode === 'user_id' && ratedUserIds.length > 0 && (
							<select
								value={selectedViewingUserId}
								onChange={(e) => setSelectedViewingUserId(e.target.value)}
								className='p-3 border border-purple-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors'
							>
								<option value=''>Select a user...</option>
								{ratedUserIds.map((id) => (
									<option key={id} value={id}>
										{id}
									</option>
								))}
							</select>
						)}
					</div>

					{/* Tiers */}
					{TIERS.map((tier) => (
						<Tier
							key={tier.id}
							tier={tier}
							items={itemsForDisplay[tier.id]}
							onDrop={handleDrop}
							isDragAndDropEnabled={viewMode === 'personal'}
							viewMode={viewMode}
						/>
					))}

					{/* Unranked Items */}
					<Tier
						tier={{ id: 'unranked', name: 'Unranked', color: '#ccc', value: -1 }}
						items={itemsForDisplay['unranked']}
						onDrop={handleDrop}
						isDragAndDropEnabled={viewMode === 'personal'}
						viewMode={viewMode}
					/>
				</div>
			)}
		</div>
	);
};

// Tier Component Props
interface TierProps {
	tier: TierDefinition | { id: string; name: string; color: string; value: number }; // Allow 'unranked' tier type
	items: TierItemData[];
	onDrop: (itemId: string, tierId: string) => void;
	isDragAndDropEnabled: boolean;
	viewMode: 'personal' | 'average' | 'user_id';
}

const Tier: React.FC<TierProps> = ({ tier, items, onDrop, isDragAndDropEnabled, viewMode }) => {
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!isDragAndDropEnabled) return;
		const itemId = e.dataTransfer.getData('itemId');
		onDrop(itemId, tier.id);
	};

	return (
		<div
			className={`mb-4 rounded-xl shadow-inner overflow-hidden border-2 border-${tier.color.replace(
				'#',
				''
			)}`}
			style={{ borderColor: tier.color }}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			<div
				className='flex items-center p-3 text-white font-bold text-xl rounded-t-lg'
				style={{ backgroundColor: tier.color }}
			>
				<span className='min-w-[50px] text-center'>{tier.name}</span>
				<div className='h-px flex-grow bg-white ml-4'></div>
			</div>
			<div className='min-h-[100px] p-4 flex flex-wrap gap-3 bg-white'>
				{items.length === 0 ? (
					<p className='text-gray-500 italic'>Drag items here</p>
				) : (
					items.map((item) => (
						<TierItem
							key={item.id}
							item={item}
							isDraggable={isDragAndDropEnabled}
							viewMode={viewMode}
						/>
					))
				)}
			</div>
		</div>
	);
};

// Tier Item Component Props
interface TierItemProps {
	item: TierItemData;
	isDraggable: boolean;
	viewMode: 'personal' | 'average' | 'user_id';
}

const TierItem: React.FC<TierItemProps> = ({ item, isDraggable, viewMode }) => {
	const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
		e.dataTransfer.setData('itemId', item.id);
	};

	return (
		<div
			className={`relative p-2 bg-gray-100 rounded-lg shadow-md border border-gray-300 flex flex-col items-center justify-center text-center cursor-grab transform transition-transform duration-200 ${
				isDraggable ? 'hover:scale-105 active:scale-95' : ''
			}`}
			draggable={isDraggable}
			onDragStart={handleDragStart}
			style={{ minWidth: '100px', maxWidth: '150px' }}
		>
			<img
				src={item.imageUrl}
				alt={item.name}
				className='w-16 h-16 rounded-md mb-2 object-cover border border-gray-200'
				onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
					e.currentTarget.onerror = null;
					e.currentTarget.src = `https://placehold.co/64x64/E0E0E0/000000?text=${encodeURIComponent(
						item.name.substring(0, 5)
					)}`;
				}}
			/>
			<span className='text-sm font-medium text-gray-700 truncate w-full px-1'>{item.name}</span>
			{viewMode === 'average' && item.averageScore && (
				<span className='absolute bottom-1 right-1 text-xs font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm'>
					Avg: {item.averageScore}
				</span>
			)}
		</div>
	);
};

export default App;
