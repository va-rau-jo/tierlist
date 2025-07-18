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
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { DroppableArea, TierRow } from '@/app/dashboard/rank/components/TierRow';
import DraggableItem from '@/app/dashboard/rank/components/DraggableItem';
import { TierList, TierListUserRankings } from '@/app/model/TierList';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TIER_ROW_HEIGHT } from '@/app/constants';
import { AveragesDisplay } from '../components/AveragesDisplay';

const RankPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	// Whether we are still loading the tier list).
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);
	const tierListId = useParams().id?.toString();
	const [tierList, setTierList] = useState<TierList | null>(null);

	// Maps user ID to the user's name
	const [userIdToNameMap, setUserIdToNameMap] = useState<Map<string, string>>();
	// Message that displays at the top of the page.
	const [message, setMessage] = useState('');
	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Dragging state variables
	const [activeItem, setActiveItem] = useState<TierListItemModel | null>(null);
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

	const handleDragStart = (event: DragStartEvent) => {
		// Find the tier list item that is currently being dragged, and set it to
		// active.
		let foundItem: TierListItemModel | null = null;
		for (const [, items] of userRankings.entries()) {
			foundItem = items.find((item) => item.id === String(event.active.id)) || null;
			if (foundItem) break;
		}
		console.log(foundItem);
		setActiveItem(foundItem);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		// Find the currently dragged item, and move it to the new correct tier
		// and update the tierListRankings map.
		const { active, over } = event;
		setActiveItem(null); // Clear active item after drag ends
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

	const handleDragCancel = () => {
		setActiveItem(null);
	};

	const saveRankings = async () => {
		if (!tierListId || !db) {
			return;
		}
		setIsSaving(true);
		await updateTierListRankings(tierListId, user.uid, userRankings, db);
		setIsSaving(false);
		setMessage('Rankings saved successfully!');
	};

	const header = (
		<>
			<h2 className='text-3xl font-bold mb-2 text-center'>Rank {tierList.name}</h2>
			<div className='flex justify-center space-x-8 text-lg py-2'>
				<span> Description: {tierList.description} </span>
				<span> Tier List Id: {tierListId} </span>
				{tierList.editorIds.has(user.uid) && (
					<Link href={`/dashboard/edit/${tierListId}`}>
						<ActionButton
							variant='outline'
							className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-0'
						>
							Edit
						</ActionButton>
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
							new TierListItem(`${userId}-${item.id}`, item.type, item.value, userName, false)
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
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200'>
			<NavBar />
			<div>
				<div className='bg-white px-8 pt-2 rounded-lg shadow-xl max-w-4xl mx-auto'>
					{message && (
						<div
							className={`p-3 mb-4 rounded-md text-center ${
								message.includes('Error')
									? 'bg-red-100 text-red-700'
									: 'bg-green-100 text-green-700'
							}`}
						>
							{message}
						</div>
					)}
					{header}
					{toggleUserRankingsDiv}
					<DndContext
						onDragEnd={handleDragEnd}
						onDragStart={handleDragStart}
						onDragCancel={handleDragCancel}
					>
						<DroppableArea
							id={UNASSIGNED_TIER}
							className={`w-full h-full min-h-30 bg-gray-800 flex items-center justify-center`}
						>
							<div className='pt-2 pl-2 pr-2 flex flex-wrap space-x-2'>
								{userRankings.get(UNASSIGNED_TIER)?.map((item) => (
									<DraggableItem key={item.id} item={item} />
								))}
							</div>
						</DroppableArea>
						<div
							className='flex flex-row bg-[#404040] border-b-4 border-l-4 border-r-4 border-black'
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
						<DragOverlay>
							{activeItem && (
								<div
									style={{
										width: '80px',
										height: 'auto',
									}}
								>
									<DraggableItem item={activeItem} isOverlay={true} />
								</div>
							)}
						</DragOverlay>
					</DndContext>
					<div className='flex flex-col sm:flex-row justify-center gap-4 mt-8'>
						<Button onClick={saveRankings} disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Save Rankings'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RankPage;
