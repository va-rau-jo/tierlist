'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import { ActionButton, Button } from '@/app/components/Button';
import {
	getTierList,
	shouldRedirectToLogin,
	updateTierListRankings,
} from '@/app/firebase/firebase_utils';
import { Tier, UNASSIGNED_TIER } from '@/app/model/Tier';
import { TierListItem } from '@/app/model/TierListItem';
import NavBar from '@/app/components/NavBar';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { DroppableArea, TierRow } from '@/app/components/TierRow';
import DraggableItem from '@/app/components/DraggableItem';
import { TierList, TierListRankings } from '@/app/model/TierList';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RankPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	// Whether we are still loading the tier list).
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);
	const tierListId = useParams().id?.toString();
	const [tierList, setTierList] = useState<TierList | null>(null);

	// Message that displays at the top of the page.
	const [message, setMessage] = useState('');
	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Dragging state variables
	const [activeItem, setActiveItem] = useState<TierListItem | null>(null);
	const [tierListAssignments, setTierListAssignments] = useState<TierListRankings>(new Map());

	useEffect(() => {
		const fetchTierList = async () => {
			// User and DB are confirmed not null
			if (isLoading || !user || !db || !tierListId || !isLoadingTierList) {
				return;
			}

			const tierListDoc = await getTierList(tierListId, db);
			if (!tierListDoc) {
				// Tier list not found
				router.push('/dashboard');
				return;
			}
			setTierList(TierList.fromFirebase(tierListDoc));

			if (tierListDoc.userRankings) {
				const userRanking = tierListDoc.userRankings.get(user.uid);
				if (userRanking) {
					setTierListAssignments(userRanking);
					setIsLoadingTierList(false);
					return;
				}
			}
			// Default to creating a new map.
			const newMap = new Map<string, TierListItem[]>(
				tierListDoc.tiers.map((tier) => [tier.id, []])
			);
			newMap.set(UNASSIGNED_TIER, tierListDoc.items);
			setTierListAssignments(newMap);
			setIsLoadingTierList(false);
		};

		fetchTierList();
	}, [db, tierListId, tierListAssignments, isLoadingTierList, user, isLoading, router]);

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

	const handleDragStart = (event: DragStartEvent) => {
		let foundItem: TierListItem | null = null;
		for (const [, items] of tierListAssignments.entries()) {
			foundItem = items.find((item) => item.id === String(event.active.id)) || null;
			if (foundItem) break;
		}
		setActiveItem(foundItem);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		setActiveItem(null); // Clear active item after drag ends

		if (!over) {
			return;
		}

		const draggedItemId = String(active.id);
		const targetTierId = String(over.id);

		// Find the item being dragged and its original tier
		let itemToMove: TierListItem | undefined;

		setTierListAssignments((prevTierItems) => {
			const newMap = new Map(prevTierItems);

			for (const [tierId, items] of prevTierItems.entries()) {
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

			// Update the tierId property of the item before adding it to the new tier
			const updatedItemToMove = { ...itemToMove, tierId: targetTierId };
			const targetTier = newMap.get(targetTierId) || [];
			newMap.set(targetTierId, [...targetTier, updatedItemToMove]);
			return newMap;
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
		await updateTierListRankings(tierListId, user.uid, tierListAssignments, db);
		setIsSaving(false);
		setMessage('Rankings saved successfully!');
	};

	const isEditor = tierList.creatorId === user.uid || tierList.editorIds.includes(user.uid);

	return (
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200'>
			<NavBar />
			<div>
				<div className='bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto'>
					<h2 className='text-3xl font-bold mb-2 text-center'>Rank {tierList.name}</h2>
					<div className='flex justify-center space-x-8 text-lg py-2'>
						<span> Description: {tierList.description} </span>
						<span> Tier List Id: {tierListId} </span>
						{isEditor && (
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
					<div>Previous Rankings</div>
					<DndContext
						onDragEnd={handleDragEnd}
						onDragStart={handleDragStart}
						onDragCancel={handleDragCancel}
					>
						<DroppableArea
							id={UNASSIGNED_TIER}
							className='w-full h-full min-h-30 bg-gray-800 flex items-center justify-center'
						>
							<div className='pt-2 pl-2 pr-2 flex flex-wrap space-x-2'>
								{tierListAssignments.get(UNASSIGNED_TIER)?.map((item) => (
									<DraggableItem key={item.id} item={item} />
								))}
							</div>
						</DroppableArea>
						<div className='flex flex-col space-y-1 bg-black p-1'>
							{tierList.tiers.map((tier) => (
								<TierRow
									key={tier.id}
									tier={tier}
									items={tierListAssignments.get(tier.id) || []}
								></TierRow>
							))}
						</div>
						<DragOverlay>
							{activeItem ? (
								<div
									style={{
										width: '80px',
										height: 'auto',
									}}
								>
									<DraggableItem item={activeItem} isOverlay={true} />
								</div>
							) : null}
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
