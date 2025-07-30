import {
	collection,
	serverTimestamp,
	query,
	where,
	getDocs,
	doc,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { TierList, TierListRankings } from '../model/TierList';
import { Tier, UNASSIGNED_TIER } from '../model/Tier';
import { TierListItemModel } from '../model/TierListItem';
import { User } from 'firebase/auth';

const TIERLIST_COLLECTION_NAME = 'tierlists';
const USER_COLLECTION_NAME = 'users';

const getUserPublicDetailsPath = (userId: string) => {
	return `users/${userId}/publicProfile/details`;
};

export const enum FirebaseReturnStatus {
	OK,
	TIERLIST_NOT_FOUND_ERROR,
	TIERLIST_NOT_CREATED_ERROR,
	TIERLIST_NOT_LEFT_ERROR,
	TIER_LIST_NOT_DELETED_ERROR,
	ALREADY_JOINED_TIERLIST_ERROR,
	USER_ALREADY_EXISTS_ERROR,
	USER_NOT_FOUND_ERROR,
}

export const shouldRedirectToLogin = (
	user: User | null,
	db: ReturnType<typeof getFirestore> | null,
	isLoading: boolean | null
): boolean => {
	// Firebase done loading, and still no user or DB
	return !isLoading && (!user || !db);
};

export const addTierList = async (
	newTierList: TierList,
	db: ReturnType<typeof getFirestore>
): Promise<TierList | FirebaseReturnStatus> => {
	/**
	 * Saves a TierList object to Firebase.
	 * @param newTierList - TierList object to be saved.
	 * @param db - The Firebase database object.
	 *
	 * @returns the updated tier list object or a firebase error.
	 */
	const newTierListDocRef = doc(collection(db, TIERLIST_COLLECTION_NAME));
	newTierList.id = newTierListDocRef.id;
	const tierListObj = newTierList.toFirebaseObject();
	try {
		await setDoc(newTierListDocRef, tierListObj);
		return newTierList;
	} catch (error) {
		console.error('Error creating tierlist:', error);
		return FirebaseReturnStatus.TIERLIST_NOT_CREATED_ERROR;
	}
};

export const updateTierList = async (
	existingTierListId: string,
	newTierList: TierList,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Updates an existing TierList object in Firebase.
	 * @param existingTierListId - ID of the TierList to update.
	 * @param newTierList - Updated TierList object.
	 * @param db - The Firebase database object.
	 */
	const tierListRef = doc(db, TIERLIST_COLLECTION_NAME, existingTierListId);

	const updateFields = {
		lastUpdatedAt: serverTimestamp(),
		name: newTierList.name,
		isPrivate: newTierList.isPrivate,
		description: newTierList.description,
		editorIds: Array.from(newTierList.editorIds),
		rankerIds: Array.from(newTierList.rankerIds),
		tiers: newTierList.tiers.map((tier: Tier) => ({
			id: tier.id,
			name: tier.name,
			color: tier.color,
		})),
		items: newTierList.items.map((item: TierListItemModel) => ({
			id: item.id,
			name: item.name,
			imageUrl: item.imageUrl,
		})),
	};

	await updateDoc(tierListRef, { ...updateFields });
	return FirebaseReturnStatus.OK;
};

export const getTierList = async (tierListId: string, db: ReturnType<typeof getFirestore>) => {
	/**
	 * Loads a tier list from Firebase.
	 * @param tierListId - The ID of the tier list to load.
	 * @param db - The Firebase database object.
	 * @returns A Promise of a TierList object. Returns null if there was an
	 * error.
	 */
	const tierListRef = doc(db, TIERLIST_COLLECTION_NAME, tierListId);
	const tierListDoc = await getDoc(tierListRef);
	if (!tierListDoc.exists()) {
		return FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR;
	}
	const tierList = TierList.fromFirebase(tierListDoc.data());
	return tierList;
};

export const joinTierList = async (
	tierListId: string,
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Adds a tier list to the current user's list of tier lists.
	 * @param tierListId - The ID of the tier list to join.
	 * @param userId - The ID of the usrer.
	 * @param db - The Firebase database object.
	 */

	// Check if the tierlist exists first and user has access.
	// If the user is not a ranker, they will not be able to access this.
	const tierListDocRef = doc(db, TIERLIST_COLLECTION_NAME, tierListId);
	try {
		await getDoc(tierListDocRef);
	} catch {
		return FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR;
	}

	const tierListRef = doc(db, `users/${userId}/tierlists`, tierListId);
	const tierListSnap = await getDoc(tierListRef);
	// Only add if it doesn't exist yet
	if (!tierListSnap.exists()) {
		await setDoc(tierListRef, {
			tierListId: tierListId,
			joinedAt: serverTimestamp(),
		});
		return FirebaseReturnStatus.OK;
	}
	return FirebaseReturnStatus.ALREADY_JOINED_TIERLIST_ERROR;
};

export const leaveTierList = async (
	tierListId: string,
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Removes a tier list from the user's list of tier lists.
	 *
	 * Also removes that person's rankings from the tierlist's rankings.
	 * @param tierListId - The ID of the tier list to leave.
	 * @param userId - The ID of the user.
	 * @param db - The Firebase database object.
	 */
	const userTierListDoc = doc(db, `users/${userId}/tierlists`, tierListId);
	await deleteDoc(userTierListDoc);

	// Remove user's rankings from tierlist's rankings list
	const tierListRef = doc(db, TIERLIST_COLLECTION_NAME, tierListId);
	const tierListDoc = await getDoc(tierListRef);

	if (!tierListDoc.exists()) {
		return FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR;
	}

	const currentRankings = tierListDoc.data().userRankings || {};
	if (currentRankings[userId]) {
		delete currentRankings[userId];
		await updateDoc(tierListRef, { rankings: currentRankings });
	}
	return FirebaseReturnStatus.OK;
};

export const deleteTierList = async (
	tierListId: string,
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Deletes a tier list from the tierlists collection, and removes it from this
	 * user's list of tier lists
	 * @param tierListId - The ID of the tier list to delete
	 * @param db - The Firebase database object
	 */
	try {
		await leaveTierList(tierListId, userId, db);
	} catch {
		return FirebaseReturnStatus.TIERLIST_NOT_LEFT_ERROR;
	}
	try {
		await deleteDoc(doc(db, TIERLIST_COLLECTION_NAME, tierListId));
	} catch {
		return FirebaseReturnStatus.TIER_LIST_NOT_DELETED_ERROR;
	}
	return FirebaseReturnStatus.OK;
};

export const updateTierListRankings = async (
	tierListId: string,
	userId: string,
	rankings: TierListRankings,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Update the rankings of a tier list in Firebase.
	 * @param tierListId - The ID of the tier list to update.
	 * @param rankings - The new rankings of the tier list.
	 * @param db - The Firebase database object.
	 */
	const tierListRef = doc(db, TIERLIST_COLLECTION_NAME, tierListId);
	const tierListDoc = await getDoc(tierListRef);

	if (!tierListDoc.exists()) {
		return FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR;
	}

	const currentRankings = tierListDoc.data().userRankings || {};
	// Skip unassigned items
	const firebaseCompatibleRanking = Object.fromEntries(
		new Map(
			Array.from(rankings.entries())
				.filter(([tierId]) => tierId !== UNASSIGNED_TIER)
				.map(([tierId, items]) => [tierId, items.map((item) => item.id)])
		)
	);
	const updatedRankings = {
		...currentRankings,
		[userId]: firebaseCompatibleRanking,
	};
	await updateDoc(tierListRef, { userRankings: updatedRankings });
	return FirebaseReturnStatus.OK;
};

export const addUser = async (
	userId: string,
	name: string,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Add user to the DB. Skips the operation if they have been added already.
	 * @param userId - The ID of the user.
	 * @param name - The name of the user.
	 * @param db - The Firebase database object.
	 */
	const userDoc = doc(db, USER_COLLECTION_NAME, userId);

	const publicProfileCollection = collection(userDoc, 'publicProfile');
	const publicProfileDoc = doc(publicProfileCollection, 'details');

	await setDoc(publicProfileDoc, {
		name: name,
		createdAt: serverTimestamp(),
	});
	await setDoc(userDoc, { id: userId }, { merge: true });
	return FirebaseReturnStatus.OK;
};

export const removeDeletedTierlistRefs = async (
	userTierListIds: string[],
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<string[]> => {
	/**
	 * Removes references to deleted tierlists from a user's tierlist collection.
	 * Checks each tierlist ID and removes it from the user's collection if the
	 * referenced tierlist no longer exists in the main tierlists collection.
	 *
	 * @param userTierListIds - Array of tierlist IDs to check
	 * @param userId - ID of the user whose tierlist references are being cleaned
	 * @param db - Firebase Firestore database instance
	 * @returns Promise<string[]> Array of valid tierlist IDs that still exist
	 */
	const validTierListIds = [];
	const checkAndDeletePromises = userTierListIds.map(async (tierListId) => {
		const tierListRef = doc(db, TIERLIST_COLLECTION_NAME, tierListId);
		const tierListDoc = await getDoc(tierListRef);

		if (!tierListDoc.exists()) {
			// Remove from user's tierlists if the tierlist doesn't exist
			const userTierListRef = doc(db, `users/${userId}/tierlists`, tierListId);
			await deleteDoc(userTierListRef);
			return null;
		}
		return tierListId;
	});

	const results = await Promise.all(checkAndDeletePromises);
	validTierListIds.push(...results.filter((id): id is string => id !== null));
	return validTierListIds;
};

export const getUserTierLists = async (
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<TierList[]> => {
	/**
	 * Loads all tier lists associated with a user from Firebase.
	 * @param userId - The ID of the user whose tier lists should be loaded.
	 * @param db - The Firebase database object.
	 * @returns A Promise of an array of TierLists.
	 */
	// Fetch list of ids that the user has stored as joined tier lists.
	console.log('AUTH2');
	console.log(userId);

	const userTierListsRef = collection(db, `users/${userId}/tierlists`);
	const userTierListsSnapshot = await getDocs(userTierListsRef);
	const userTierListIds = userTierListsSnapshot.docs.map((doc) => doc.data().tierListId);

	if (userTierListIds.length === 0) {
		return [];
	}

	const validTierListIds = await removeDeletedTierlistRefs(userTierListIds, userId, db);
	if (validTierListIds.length === 0) {
		return [];
	}

	const tierListsRef = collection(db, TIERLIST_COLLECTION_NAME);
	const q = query(tierListsRef, where('__name__', 'in', validTierListIds));
	return (await getDocs(q)).docs.map((doc) => TierList.fromFirebase(doc.data()));
};

export const getUserNameFromUserId = async (
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<string | FirebaseReturnStatus> => {
	const userDoc = doc(db, getUserPublicDetailsPath(userId));
	const userSnapshot = await getDoc(userDoc);

	if (!userSnapshot.exists()) {
		return FirebaseReturnStatus.USER_NOT_FOUND_ERROR;
	}

	const userData = userSnapshot.data();
	return userData.name;
};

export const getUserNamesFromUserIds = async (
	userIdsSet: Set<string>,
	db: ReturnType<typeof getFirestore>
): Promise<Map<string, string | FirebaseReturnStatus>> => {
	const userIdToNameMap = new Map<string, string>();
	if (userIdsSet.size === 0) {
		return userIdToNameMap;
	}

	const promises = Array.from(userIdsSet).map(async (userId) => {
		const userDoc = doc(db, getUserPublicDetailsPath(userId));
		const userSnapshot = await getDoc(userDoc);

		if (!userSnapshot.exists()) {
			return [userId, FirebaseReturnStatus.USER_NOT_FOUND_ERROR] as const;
		}
		const userData = userSnapshot.data();
		return [userId, userData.name] as const;
	});

	const results = await Promise.all(promises);
	results.forEach(([userId, name]) => {
		userIdToNameMap.set(userId, name);
	});

	return userIdToNameMap;
};
