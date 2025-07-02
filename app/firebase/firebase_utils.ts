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
	 * @returns the id of the new TierList object
	 */
	const tierListObj = newTierList.toFirebaseObject();
	const tierListRef = collection(db, 'tierlist');
	return (await addDoc(tierListRef, tierListObj)).id;
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
			tierlists: [],
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
	const userTierListsRef = collection(db, `users/${userId}/tierlists`);
	const q = query(userTierListsRef, where('tierListId', '==', tierListId));
	const existingDocs = await getDocs(q);

	if (existingDocs.empty) {
		await addDoc(userTierListsRef, {
			tierListId: tierListId,
			joinedAt: serverTimestamp(),
			rankings: {},
		});
	}
};
