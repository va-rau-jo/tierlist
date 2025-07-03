import {
	collection,
	addDoc,
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
import { TierList } from '../model/TierList';
import { Tier } from '../model/Tier';
import { TierListItem } from '../model/TierListItem';

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
	return newTierList;
};

export const updateTierList = async (
	existingTierListId: string,
	newTierList: TierList,
	db: ReturnType<typeof getFirestore>
) => {
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
		tiers: newTierList.tiers.map((tier: Tier) => ({
			id: tier.id,
			name: tier.name,
			color: tier.color,
		})),
		items: newTierList.items.map((item: TierListItem) => ({
			id: item.id,
			type: item.type,
			value: item.value,
		})),
	};

	await updateDoc(tierListRef, { ...updateFields });
};

export const getTierList = async (tierListId: string, db: ReturnType<typeof getFirestore>) => {
	/**
	 * Loads a tier list from Firebase.
	 * @param tierListId - The ID of the tier list to load.
	 * @param db - The Firebase database object.
	 * @returns A Promise of a TierList object. Returns null if there was an error.
	 */
	const tierListRef = doc(db, 'tierlist', tierListId);
	const tierListDoc = await getDoc(tierListRef);
	if (tierListDoc.exists()) {
		return TierList.fromFirebase(tierListDoc.data());
	} else {
		return null;
	}
};

export const addUser = async (
	userId: string,
	name: string,
	db: ReturnType<typeof getFirestore>
) => {
	/**
	 * Add user to the DB. Skips the operation if they have been added already.
	 * @param userId - The ID of the user.
	 * @param name - The name of the user.
	 * @param db - The Firebase database object.
	 */
	const usersRef = doc(db, 'users', userId);
	const userDoc = await getDoc(usersRef);

	if (!userDoc.exists()) {
		await setDoc(usersRef, {
			userId: userId,
			name: name,
			createdAt: serverTimestamp(),
		});
	} else {
		console.log('User already added.');
	}
};

export const updateUserTierList = async (
	tierListId: string,
	userId: string,
	db: ReturnType<typeof getFirestore>
) => {
	/**
	 * Updates the user's tier list with the given tier list ID.
	 * @param tierListId - The ID of the tier list to join.
	 * @param userId - The ID of the user.
	 * @param db - The Firebase database object.
	 */
	const userTierListRef = doc(db, `users/${userId}/tierlists`, tierListId);
	const existingDoc = await getDoc(userTierListRef);

	if (!existingDoc.exists()) {
		await setDoc(userTierListRef, {
			tierListId: tierListId,
			joinedAt: serverTimestamp(),
		});
	}
};

export const getUserTierLists = async (userId: string, db: ReturnType<typeof getFirestore>) => {
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
