'use client';

import React, { SetStateAction, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TierListEditor, TierListEditorMode } from '@/app/components/TierListEditor';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import { Button } from '@/app/components/Button';
import { getTierList, updateTierList } from '@/app/firebase/firebase_utils';
import { TierList } from '@/app/model/TierList';
import { Tier } from '@/app/model/Tier';
import { TierListItem } from '@/app/model/TierListItem';
import { Input } from '@/app/components/Input';
import NavBar from '@/app/components/NavBar';

const EditPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const tierListId = useParams().id?.toString();

	// Name and description of the tier list
	const [listName, setListName] = useState('');
	const [listDescription, setListDescription] = useState('');
	// Items and tiers (tiers are started as defaults, items starts empty).
	const [items, setItems] = useState<TierListItem[]>([]);
	const [tiers, setTiers] = useState<Tier[]>([]);
	// Message that displays at the top of the page.
	const [message, setMessage] = useState('');
	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Id of the created tier list (so we don't re-create instead of overwriting).
	const [listId, setListId] = useState(tierListId);
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);
	const [creatorId, setCreatorId] = useState(user?.uid);

	useEffect(() => {
		const fetchTierList = async () => {
			if (!tierListId || !db) {
				return;
			}
			const tierListDoc = await getTierList(tierListId, db);
			console.log(tierListDoc);
			if (tierListDoc) {
				setListName(tierListDoc.name);
				setListDescription(tierListDoc.description);
				setItems(tierListDoc.items);
				setTiers(tierListDoc.tiers);
				setIsLoadingTierList(false);
				setCreatorId(tierListDoc.creatorId);
			}
		};

		console.log(tierListId);

		fetchTierList();
	}, [listId, db, tierListId, setIsLoadingTierList]);

	if (isLoading || !user || isLoadingTierList) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		);
	}

	const isCreator = creatorId === user.uid;

	return (
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200'>
			<NavBar />
			<div>
				<div className='bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto'>
					<h2 className='text-3xl font-bold mb-2 text-center'>Rank {listName}</h2>
					<div className='flex justify-center space-x-8 text-lg py-2'>
						<span> Description: {listDescription} </span>
						<span> Tier List Id: {listId} </span>
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
					{/* Item Bank */}
					<div className='w-full h-full min-h-30 bg-gray-800 flex items-center justify-center'>
						{items.length === 0 ? (
							<span className='text-lg text-gray-50 font-semibold'>No Items</span>
						) : (
							<div className='pt-2 pl-2 pr-2 flex flex-wrap space-x-2'>
								{items.map((item: TierListItem, index) => (
									<div
										key={index}
										className='w-15 mb-2 aspect-square flex items-center justify-center bg-white'
									>
										<span> {item.value}</span>
									</div>
								))}
							</div>
						)}
					</div>

					<div className='space-y-1 bg-black p-1'>
						{/* Tiers */}
						{tiers.map((tier) => (
							<div className='h-20 flex' key={tier.id}>
								<div className='flex grow-1 sm:flex-row gap-3 items-center bg-[#404040]'>
									<div
										className='h-20 aspect-square flex items-center justify-center'
										style={{ backgroundColor: tier.color }}
									>
										<span className='w-3/4 text-center text-xl font-bold'> {tier.name} </span>
									</div>
								</div>
							</div>
						))}
					</div>
					<div className='flex flex-col sm:flex-row justify-center gap-4 mt-8'>
						<Button onClick={() => {}} disabled={isSaving}>
							{isSaving ? 'Saving...' : 'Save Tier List'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditPage;
