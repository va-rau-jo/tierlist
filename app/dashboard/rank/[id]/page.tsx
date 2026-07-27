'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { Button } from '@/app/components/Button';
import {
	FirebaseReturnStatus,
	getTierList,
	shouldRedirectToLogin,
	updateTierListRankings,
} from '@/app/firebase/firebase_utils';
import { Tier, UNASSIGNED_TIER } from '@/app/model/Tier';
import { TierListItem, TierListItemModel } from '@/app/model/TierListItem';
import NavBar from '@/app/components/NavBar';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { TierRow } from '@/app/dashboard/rank/components/TierRow';
import { TierList, TierListUserRankings } from '@/app/model/TierList';
import { useRouter } from 'next/navigation';
import { DEFAULT_ITEM_SIZE, TIER_ROW_BG_COLOR, TIER_ROW_HEIGHT } from '@/app/constants';
import { AveragesDisplay } from '../components/AveragesDisplay';
import { usePopup } from '@/app/components/providers/PopupProvider';
import { Page, PageBody } from '@/app/components/Page';
import { DroppableArea } from '../components/DroppableArea';
import RenderedItem from '@/app/dashboard/rank/components/RenderedItem';
import { RankingPageHeader } from '../components/RankingPageHeader';
import { useUserNames } from '@/app/components/providers/UserNamesProvider';

const RANKING_CONTAINER_HEIGHT = `calc(var(--spacing) * ${TIER_ROW_HEIGHT * 6})`;

const RankPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const { showPopup } = usePopup();
	const { getUserName, fetchUserName } = useUserNames();
	// Whether we are still loading the tier list).
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);
	const tierListId = useParams().id?.toString();
	const [tierList, setTierList] = useState<TierList | null>(null);

	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Maps user ID to TierListRankings: Tier ID: list of tier list items
	const [tierListRankings, setTierListRankings] = useState<TierListUserRankings>(new Map());
	// Maps user ID to TierListRankings, for the other users.
	const [displayedTierListRankings, setDisplayedTierListRankings] = useState<TierListUserRankings>(
		new Map()
	);
	// Whether we are displaying the average display.
	const [isDisplayingAverage, setIsDisplayingAverage] = useState(false);
	// Tracks the currently dragged item (hides the original while dragging).
	const [activeItemId, setActiveItemId] = useState<string | null>();
	// Tracks the user selected item size.
	const [itemSize, setItemSize] = useState(DEFAULT_ITEM_SIZE);

	// Require a small movement before drag starts so long-press can show the name.
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		})
	);

	const activeItem = useMemo(() => {
		if (activeItemId && user) {
			const userRanking = tierListRankings.get(user.uid);
			if (userRanking) {
				const tierIterator = userRanking.values();
				let foundItem;
				for (const items of tierIterator) {
					foundItem = items.find((item) => item.id === activeItemId);
					if (foundItem) break;
				}
				return foundItem;
			}
		}
		return null;
	}, [activeItemId, tierListRankings, user]);

	useEffect(() => {
		if (isLoading || !user || !db || !tierListId || !isLoadingTierList) {
			// If isLoadingTierList is false, then we already fetched.
			// If user/db/isLoading are missing/true, Firebase is not ready.
			// If tierListId is missing, we shouldn't be here.
			return;
		}

		const fetchTierList = async () => {
			setIsLoadingTierList(true);

			const tierList = await getTierList(tierListId, db);
			if (tierList === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
				router.push('/dashboard');
				return;
			}
			setTierList(tierList);

			let userRankingSet = false;
			if (tierList.userRankings) {
				// Fetch all usernames of userIds in userRankings
				await Promise.all(tierList.userRankings.keys().map((userId) => fetchUserName(userId)));
				if (tierList.userRankings.has(user.uid)) {
					userRankingSet = true;
				}
			}
			if (!userRankingSet) {
				// We will use the current UserRankings if they exist, otherwise create
				// a new map.
				const newMap = new Map<string, TierListItemModel[]>(
					tierList.tiers.map((tier) => [tier.id, []])
				);
				newMap.set(UNASSIGNED_TIER, tierList.items);
				tierList.userRankings.set(user.uid, newMap);
			}
			setTierListRankings(tierList.userRankings);
			setIsLoadingTierList(false);
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
		fetchUserName,
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
	if (!userRankings) {
		return;
	}
	const allRankings = new Map(displayedTierListRankings);
	allRankings.set(user.uid, userRankings);

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
		setActiveItemId(null); // Reset active ID when drag ends
	};

	// Handle when the displayed rankings of a user is changed.
	const handleDisplayedRankingChanged = (userId: string) => {
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

	// Map a tier to a rendered TierRow object.
	const mapTierRows = (tier: Tier, index: number) => {
		// Maps username to list of items
		const allItems = new Map<string, TierListItemModel[]>();
		// Add current user items
		const userItems = userRankings.get(tier.id)!;
		allItems.set(user.uid, userItems);

		for (const [userId, rankingMap] of displayedTierListRankings.entries()) {
			for (const [tierId, items] of rankingMap) {
				if (tierId === tier.id) {
					const userName = 'NAME';
					const newItems = items.map(
						(item) =>
							new TierListItem(`${userId}-${item.id}`, item.name, item.imageUrl, 'name', false)
					);
					allItems.set(userName, newItems);
				}
			}
		}
		return <TierRow key={tier.id} tier={tier} index={index} items={allItems} itemSize={itemSize} />;
	};

	const toggleUserRankingsDiv = (
		<>
			{tierListRankings && (
				<div className='flex flex-col flex-1 items-center mb-4 p-4 bg-gray-100 rounded-lg'>
					<span className='font-semibold mb-2 w-fit'>Show Other Rankings</span>
					<div className='space-y-2'>
						{Array.from(tierListRankings)
							.filter(([userId]) => userId !== user.uid)
							.map(([userId]) => (
								<div key={userId}>
									<span className='text-sm font-medium'>{getUserName(userId)}</span>
									<input
										type='checkbox'
										className='ml-2'
										checked={displayedTierListRankings.has(userId)}
										onChange={() => handleDisplayedRankingChanged(userId)}
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
		</>
	);

	const displaySettingsDiv = (
		<>
			{tierListRankings && (
				<div className='flex flex-col flex-1 items-center mb-4 p-4 bg-gray-100 rounded-lg'>
					<span className='font-semibold mb-2 w-fit'>Display Settings</span>
					<div className='space-y-2'>
						<div className='flex'>
							<span className='text-sm font-medium'>Item Size</span>
							<input
								type='range'
								min={10}
								max={25}
								defaultValue={15}
								className='ml-2'
								onChange={(e) => {
									setItemSize(Number(e.target.value));
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);

	const unassignedItemsArea = (
		<DroppableArea
			id={UNASSIGNED_TIER}
			className={`w-full h-full min-h-30 bg-gray-800 flex items-center justify-center`}
		>
			<div className='p-2 flex flex-wrap space-x-2 space-y-2'>
				{userRankings.get(UNASSIGNED_TIER)?.map((item) => (
					<RenderedItem key={item.id} item={item} itemSize={itemSize} isDraggable={true} />
				))}
			</div>
		</DroppableArea>
	);

	const rankingContainer = (
		<div
			className={`flex flex-row bg-[${TIER_ROW_BG_COLOR}] border-y-2 border-black`}
			style={{ minHeight: RANKING_CONTAINER_HEIGHT }}
		>
			<div className='flex flex-col flex-3'>
				{tierList.tiers.map((tier, index) => mapTierRows(tier, index))}
			</div>
			{isDisplayingAverage && (
				<>
					<AveragesDisplay tierList={tierList} allRankings={allRankings} itemSize={itemSize} />
				</>
			)}
		</div>
	);

	return (
		<Page>
			<DndContext
				sensors={sensors}
				onDragStart={(event) => setActiveItemId(event.active.id as string)}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setActiveItemId(null)}
			>
				<NavBar />
				<PageBody>
					<RankingPageHeader tierList={tierList} />
					<div className='flex w-full space-x-8'>
						{toggleUserRankingsDiv}
						{displaySettingsDiv}
					</div>
					{unassignedItemsArea}
					{rankingContainer}
					<div className='flex flex-col sm:flex-row justify-center gap-4 mt-8'>
						<Button onClick={saveRankings} disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Save Rankings'}
						</Button>
					</div>
				</PageBody>
				<DragOverlay>
					{activeItem ? (
						<RenderedItem item={activeItem} itemSize={itemSize} isDraggable={true} />
					) : null}
				</DragOverlay>
			</DndContext>
		</Page>
	);
};

export default RankPage;
