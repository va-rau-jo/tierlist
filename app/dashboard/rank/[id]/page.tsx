'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import { ActionButton, Button } from '@/app/components/Button';
import {
	FirebaseReturnStatus,
	getTierList,
	getUserIdsToNamesMap,
	shouldRedirectToLogin,
	updateTierListRankings,
} from '@/app/firebase/firebase_utils';
import { Tier, UNASSIGNED_TIER } from '@/app/model/Tier';
import { TierListItem, TierListItemModel } from '@/app/model/TierListItem';
import NavBar from '@/app/components/NavBar';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { TierRow } from '@/app/dashboard/rank/components/TierRow';
import { TierList, TierListUserRankings } from '@/app/model/TierList';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TIER_ROW_BG_COLOR, TIER_ROW_HEIGHT } from '@/app/constants';
import { AveragesDisplay } from '../components/AveragesDisplay';
import { usePopup } from '@/app/components/popup/PopupContext';
import { PageBody } from '@/app/components/PageBody';
import { DroppableArea } from '../components/DroppableArea';
import RenderedItem from '@/app/dashboard/rank/components/RenderedItem';

const RankPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const { showPopup } = usePopup();
	// Whether we are still loading the tier list).
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);
	const tierListId = useParams().id?.toString();
	const [tierList, setTierList] = useState<TierList | null>(null);

	// Maps user ID to the user's name
	const [userIdToNameMap, setUserIdToNameMap] = useState<Map<string, string>>();
	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Maps user ID to TierListRankings: Tier ID: list of tier list items
	const [tierListRankings, setTierListRankings] = useState<TierListUserRankings>(new Map());
	// Maps user ID to TierListRankings, for the other users.
	const [displayedTierListRankings, setDisplayedTierListRankings] = useState<TierListUserRankings>(
		new Map()
	);
	const [isDisplayingAverage, setIsDisplayingAverage] = useState(false);

	useEffect(() => {
		if (isLoading || !user || !db || !tierListId || !isLoadingTierList) {
			// If isLoadingTierList is false, then we already fetched.
			// If user/db/isLoading are missing/true, Firebase is not ready.
			// If tierListId is missing, we shouldn't be here.
			return;
		}

		const fetchTierList = async () => {
			console.log('FETCHING');
			// User and DB are confirmed not null
			setIsLoadingTierList(true); // This update should *not* be a dependency

			try {
				const tierList = await getTierList(tierListId, db);
				if (tierList === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
					router.push('/dashboard');
					return;
				}
				setTierList(tierList);

				let userRankingSet = false;
				if (tierList.userRankings) {
					// All other user IDs who have ranked the tier list.
					const userIds = Array.from(tierList.userRankings.keys());
					setUserIdToNameMap(await getUserIdsToNamesMap(new Set(userIds), db));
					const userRanking = tierList.userRankings.get(user.uid);
					if (userRanking) {
						// We will set the current user's rankings since it exists.
						userRankingSet = true;
					}
				}
				if (!userRankingSet) {
					// Default to creating a new map.
					const newMap = new Map<string, TierListItemModel[]>(
						tierList.tiers.map((tier) => [tier.id, []])
					);
					newMap.set(UNASSIGNED_TIER, tierList.items);
					tierList.userRankings.set(user.uid, newMap);
				}
				setTierListRankings(tierList.userRankings);
			} finally {
				setIsLoadingTierList(false);
			}
		};

		fetchTierList();
	}, [
		db,
		tierListId,
		setTierList,
		setTierListRankings,
		isLoadingTierList,
		user,
		isLoading,
		router,
	]);

	if (shouldRedirectToLogin(user, db, isLoading)) {
		router.push('/');
		return;
	}

	// User and DB are confirmed not null
	if (isLoading || !user || !db || isLoadingTierList || !tierList) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		);
	}

	const userRankings = tierListRankings.get(user.uid);
	if (!userRankings || !userIdToNameMap) {
		return;
	}

	const handleDragEnd = (event: DragEndEvent) => {
		// Find the currently dragged item, and move it to the new correct tier
		// and update the tierListRankings map.
		const { active, over } = event;
		// The item is not being held over a tier.
		if (!over) {
			return;
		}

		const draggedItemId = String(active.id);
		const targetTierId = String(over.id);
		let itemToMove: TierListItemModel | undefined;

		setTierListRankings((prevTierItems) => {
			const rankings = prevTierItems.get(user.uid);
			if (!rankings) {
				return prevTierItems;
			}
			const newMap = new Map(rankings);

			for (const [tierId, items] of rankings.entries()) {
				const itemIndex = items.findIndex((item) => item.id === draggedItemId);
				if (itemIndex !== -1) {
					itemToMove = items[itemIndex];
					const updatedOriginalTier = [...items];
					updatedOriginalTier.splice(itemIndex, 1);
					newMap.set(tierId, updatedOriginalTier);
					break;
				}
			}

			if (!itemToMove) {
				return prevTierItems;
			}

			const targetTier = newMap.get(targetTierId) || [];
			newMap.set(targetTierId, [...targetTier, itemToMove]);
			// Add the current user's new rankings to the map of all rankings
			const newTierItems = new Map(prevTierItems);
			newTierItems.set(user.uid, newMap);
			return newTierItems;
		});
	};

	const saveRankings = async () => {
		if (!tierListId || !db) {
			return;
		}
		setIsSaving(true);
		updateTierListRankings(tierListId, user.uid, userRankings, db).then((status) => {
			if (status !== FirebaseReturnStatus.OK) {
				showPopup('Rankings failed to save.', 'error');
			} else {
				setIsSaving(false);
				showPopup('Rankings saved successfully!', 'success');
			}
		});
	};

	const header = (
		<>
			<h2 className='text-3xl font-bold mb-2 text-center'>Rank {tierList.name}</h2>
			<div className='flex justify-center items-center space-x-8  py-2'>
				<span className='text-lg'> Description: {tierList.description} </span>
				<span className='text-lg'> Tier List Id: {tierListId} </span>
				{tierList.editorIds.has(user.uid) && (
					<Link href={`/dashboard/edit/${tierListId}`}>
						<ActionButton variant='outline'>Edit</ActionButton>
					</Link>
				)}
			</div>
		</>
	);

	const toggleUserRankingsDiv = (
		<div>
			{tierListRankings && userIdToNameMap && (
				<div className='flex flex-col items-center mb-4 p-4 bg-gray-100 rounded-lg'>
					<span className='font-semibold mb-2 w-fit'>Show Other Rankings</span>
					<div className='space-y-2'>
						{Array.from(tierListRankings)
							.filter(([userId]) => userId !== user.uid)
							.map(([userId]) => (
								<div key={userId}>
									<span className='text-sm font-medium'>{userIdToNameMap.get(userId)}</span>
									<input
										type='checkbox'
										className='ml-2'
										checked={displayedTierListRankings.has(userId)}
										onChange={() => handleRankingCheckedChange(userId)}
									/>
								</div>
							))}
						<div>
							<span className='text-sm font-medium'>Show Averages</span>
							<input
								type='checkbox'
								className='ml-2'
								checked={isDisplayingAverage}
								onChange={() => setIsDisplayingAverage(!isDisplayingAverage)}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);

	const handleRankingCheckedChange = (userId: string) => {
		if (displayedTierListRankings.has(userId)) {
			setDisplayedTierListRankings((prev) => {
				const newMap = new Map(prev);
				newMap.delete(userId);
				return newMap;
			});
		} else {
			setDisplayedTierListRankings((prev) => {
				const newMap = new Map(prev);
				const rankings = tierListRankings.get(userId)!;
				// Copy rankings, set the tier list items to non modifiable
				const newRankings = new Map(rankings);
				for (const [tierId, items] of newRankings.entries()) {
					newRankings.set(
						tierId,
						items.map((item) => Object.freeze({ ...item, isModifiable: false }))
					);
				}
				newMap.set(userId, newRankings);
				return newMap;
			});
		}
	};

	const mapTierRows = (tier: Tier, index: number) => {
		// Maps username to list of items
		const allItems = new Map<string, TierListItemModel[]>();
		// Add current user items
		const userItems = userRankings.get(tier.id)!;
		allItems.set(user.uid, userItems);

		for (const [userId, rankingMap] of displayedTierListRankings.entries()) {
			for (const [tierId, items] of rankingMap) {
				if (tierId === tier.id) {
					const userName = userIdToNameMap.get(userId)!;
					const newItems = items.map(
						(item) =>
							new TierListItem(`${userId}-${item.id}`, item.name, item.imageUrl, userName, false)
					);
					allItems.set(userName, newItems);
				}
			}
		}
		return <TierRow key={tier.id} tier={tier} index={index} items={allItems} />;
	};

	const mainContainerHeight = `calc(var(--spacing) * ${TIER_ROW_HEIGHT * 6})`;

	const allRankings = new Map(displayedTierListRankings);
	allRankings.set(user.uid, userRankings);

	return (
		<PageBody>
			<DndContext onDragEnd={handleDragEnd}>
				<NavBar />
				<div>
					<div className='bg-white px-8 pt-2 rounded-lg shadow-xl max-w-5xl mx-auto'>
						{header}
						{toggleUserRankingsDiv}
						<DroppableArea
							id={UNASSIGNED_TIER}
							className={`w-full h-full min-h-30 bg-gray-800 flex items-center justify-center`}
						>
							<div className='pt-2 pl-2 pr-2 flex flex-wrap space-x-2'>
								{userRankings.get(UNASSIGNED_TIER)?.map((item) => (
									<RenderedItem key={item.id} item={item} />
								))}
							</div>
						</DroppableArea>
						<div
							className={`flex flex-row bg-[${TIER_ROW_BG_COLOR}] border-b-4 border-l-4 border-r-4 border-black`}
							style={{ height: mainContainerHeight }}
						>
							<div className='flex flex-col flex-3'>
								{tierList.tiers.map((tier, index) => mapTierRows(tier, index))}
							</div>
							{isDisplayingAverage && (
								<>
									<AveragesDisplay tierList={tierList} allRankings={allRankings} />
								</>
							)}
						</div>
						<div className='flex flex-col sm:flex-row justify-center gap-4 mt-8'>
							<Button onClick={saveRankings} disabled={isSaving}>
								{isSaving ? 'Saving...' : 'Save Rankings'}
							</Button>
						</div>
					</div>
				</div>
			</DndContext>
		</PageBody>
	);
};

export default RankPage;
