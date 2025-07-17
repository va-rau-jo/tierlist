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
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { TierList, TierListRankings } from '../model/TierList';
import { Tier, UNASSIGNED_TIER } from '../model/Tier';
import { TierListItemModel } from '../model/TierListItem';
import { User } from 'firebase/auth';

export const enum FirebaseReturnStatus {
	OK,
	TIERLIST_NOT_FOUND_ERROR,
	ALREADY_JOINED_TIERLIST_ERROR,
	USER_ALREADY_EXISTS_ERROR,
}

export const shouldRedirectToLogin = (
	user: User | null,
	db: ReturnType<typeof getFirestore> | null,
	isLoading: boolean | null
): boolean => {
	// Firebase done loading, and still no user or DB
	return !isLoading && (!user || !db);
};

export const addTierList = async (newTierList: TierList, db: ReturnType<typeof getFirestore>) => {
	/**
	 * Saves a TierList object to Firebase.
	 * @param newTierList - TierList object to be saved.
	 * @param db - The Firebase database object.
	 *
	 * @returns the updated tier list object.
	 */
	const newTierListDocRef = doc(collection(db, 'tierlist'));
	newTierList.id = newTierListDocRef.id;
	const tierListObj = newTierList.toFirebaseObject();
	await setDoc(newTierListDocRef, tierListObj);
	await updateEditorUserTierLists(newTierList.id, newTierList.editorIds, db);
	return newTierList;
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
	const tierListRef = doc(db, 'tierlist', existingTierListId);

	const updateFields = {
		lastUpdatedAt: serverTimestamp(),
		name: newTierList.name,
		description: newTierList.description,
		editorIds: Array.from(newTierList.editorIds),
		tiers: newTierList.tiers.map((tier: Tier) => ({
			id: tier.id,
			name: tier.name,
			color: tier.color,
		})),
		items: newTierList.items.map((item: TierListItemModel) => ({
			id: item.id,
			type: item.type,
			value: item.value,
		})),
	};

	await updateDoc(tierListRef, { ...updateFields });
	await updateEditorUserTierLists(existingTierListId, newTierList.editorIds, db);
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
	const tierListRef = doc(db, 'tierlist', tierListId);
	const tierListDoc = await getDoc(tierListRef);
	if (tierListDoc.exists()) {
		return TierList.fromFirebase(tierListDoc.data());
	}
	return FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR;
};

export const joinTierList = async (
	tierListId: string,
	userId: string,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Adds a tier list to the current user's list of tier lists.
	 * @param tierListId - The ID of the tier list to join.
	 * @param uyserId - The ID of the usrer.
	 * @param db - The Firebase database object.
	 */
	const userTierListsCollectionRef = collection(db, `users/${userId}/tierlists`);

	// Check if the tierlist already exists in user's collection
	const existingTierListDocs = await getDocs(
		query(userTierListsCollectionRef, where('tierListId', '==', tierListId))
	);

	// Only add if it doesn't exist yet
	if (existingTierListDocs.empty) {
		await setDoc(doc(userTierListsCollectionRef), {
			tierListId: tierListId,
			joinedAt: serverTimestamp(),
		});
		return FirebaseReturnStatus.OK;
	}
	return FirebaseReturnStatus.ALREADY_JOINED_TIERLIST_ERROR;
};

const updateEditorUserTierLists = async (
	tierListId: string,
	editorIds: Set<string>,
	db: ReturnType<typeof getFirestore>
): Promise<FirebaseReturnStatus> => {
	/**
	 * Updates the user profiles of all editors to include the new tier list.
	 * This function adds the tier list ID to each editor's list of tier lists in
	 * their user profile.
	 */
	// Remove duplicates
	for (const editorId of editorIds) {
		await joinTierList(tierListId, editorId, db);
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
	const tierListRef = doc(db, 'tierlist', tierListId);
	const tierListDoc = await getDoc(tierListRef);

	if (!tierListDoc.exists()) {
		return FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR;
	}

	const currentRankings = tierListDoc.data().rankings || {};
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
	await updateDoc(tierListRef, { rankings: updatedRankings });
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
	const usersRef = doc(db, 'users', userId);
	const userDoc = await getDoc(usersRef);

	if (userDoc.exists()) {
		console.log('User already added.');
		return FirebaseReturnStatus.USER_ALREADY_EXISTS_ERROR;
	}

	await setDoc(usersRef, {
		userId: userId,
		name: name,
		createdAt: serverTimestamp(),
	});
	return FirebaseReturnStatus.OK;
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
	const userTierListsRef = collection(db, `users/${userId}/tierlists`);
	const userTierListsSnapshot = await getDocs(userTierListsRef);
	const userTierListIds = userTierListsSnapshot.docs.map((doc) => doc.data().tierListId);

	if (userTierListIds.length === 0) {
		return [];
	}

	// Fetch tier lists where the tier list ID matches the user's tier list IDs.
	const tierListsRef = collection(db, 'tierlist');
	const tierListQuery = query(tierListsRef, where('__name__', 'in', userTierListIds));
	const tierListDocs = await getDocs(tierListQuery);

	// All user accessible tier lists
	const tierLists = tierListDocs.docs.map((doc) => TierList.fromFirebase(doc.data()));
	return tierLists;
};

export const getUserIdsToNamesMap = async (
	userIdsSet: Set<string>,
	db: ReturnType<typeof getFirestore>
): Promise<Map<string, string>> => {
	/**
	 * Loads a map of user IDs to names from Firebase.
	 * @param userIdsSet - The IDs of the users whose names should be loaded.
	 * @param db - The Firebase database object.
	 * @returns A Promise of a Map of user IDs to names.
	 */
	if (userIdsSet.size === 0) {
		return new Map<string, string>();
	}
	const userRef = collection(db, 'users');
	const userDocs = await getDocs(query(userRef, where('userId', 'in', Array.from(userIdsSet))));
	const userIdToNameMap = new Map<string, string>();
	userDocs.forEach((doc) => {
		userIdToNameMap.set(doc.data().userId, doc.data().name);
	});
	return userIdToNameMap;
};
