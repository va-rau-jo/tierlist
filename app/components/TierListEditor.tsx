import { SetStateAction, useEffect, useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { useFirebase } from '../firebase/FirebaseProvider';
import { TierListItemModel } from '../model/TierListItem';
import {
	addTierList,
	getTierList,
	updateUserTierList,
	updateTierList,
} from '../firebase/firebase_utils';
import { TierList, TierListRankings } from '../model/TierList';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { Tier } from '../model/Tier';
import { generateUniqueId } from '../utils';

enum TierListEditorMode {
	Create,
	Edit,
}

interface TierListEditorProps {
	// Whether we are creating or editing an existing tier list
	mode: TierListEditorMode;
	// The tier list id (only if we are editing an existing tier list)
	tierListId?: string;
}

const createNewTierListItem = () => {
	return new TierListItemModel(generateUniqueId(), 'text', '');
};

const createNewTier = (name: string, color: string) => {
	return new Tier(generateUniqueId(), name, color);
};

const TierListEditor: React.FC<TierListEditorProps> = ({ mode, tierListId }) => {
	const { db, user } = useFirebase();
	// Name and description of the tier list
	const [listName, setListName] = useState('');
	const [listDescription, setListDescription] = useState('');
	// The current item we are trying to add
	const [currentAddItem, setCurrentAddItem] = useState(createNewTierListItem());
	// Items and tiers (tiers are started as defaults, items starts empty).
	const [items, setItems] = useState<TierListItemModel[]>([]);
	const [tiers, setTiers] = useState([
		createNewTier('S', '#FF7F7F'),
		createNewTier('A', '#FFBF7F'),
		createNewTier('B', '#FFFF7F'),
		createNewTier('C', '#BFFF7F'),
		createNewTier('D', '#7FFFFF'),
		createNewTier('F', '#FF7FFF'),
	]);
	// Message that displays at the top of the page.
	const [message, setMessage] = useState('');
	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Id of the created tier list (so we don't re-create instead of overwriting).
	const [listId, setListId] = useState(tierListId);
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);
	const [creatorId, setCreatorId] = useState(user?.uid);
	const [editorIds, setEditorIds] = useState<string[]>([]);

	useEffect(() => {
		const fetchTierList = async () => {
			if (mode == TierListEditorMode.Create) {
				setIsLoadingTierList(false);
			}
			if (mode === TierListEditorMode.Edit && listId && db) {
				const tierListDoc = await getTierList(listId, db);
				if (tierListDoc) {
					setListName(tierListDoc.name);
					setListDescription(tierListDoc.description);
					setItems(tierListDoc.items);
					setTiers(tierListDoc.tiers);
					setCreatorId(tierListDoc.creatorId);
					setEditorIds(tierListDoc.editorIds);
					setIsLoadingTierList(false);
				}
			}
		};

		fetchTierList();
	}, [mode, listId, db]);

	if (!user || !db) {
		return null;
	}

	if (isLoadingTierList) {
		return <div>Loading...</div>;
	}

	// Add a new item input field
	const handleAddItem = () => {
		setItems([...items, currentAddItem]);
		setCurrentAddItem(createNewTierListItem());
	};

	// Update item value (text or image URL)
	const handleCurrentItemChange = (field: string, value: string) => {
		setCurrentAddItem((prev) => ({ ...prev, [field]: value }));
	};

	// Update item value (text or image URL)
	const handleItemChange = (id: string, field: string, value: string) => {
		setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
	};

	// Remove an item input field
	const handleRemoveItem = (id: string) => {
		setItems(items.filter((item) => item.id !== id));
	};

	// Add a new tier
	const handleAddTier = () => {
		setTiers([...tiers, { id: generateUniqueId(), name: '', color: '#CCCCCC' }]);
	};

	// Update tier properties
	const handleTierChange = (id: string, field: string, value: string) => {
		setTiers(tiers.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)));
	};

	// Remove a tier
	const handleRemoveTier = (id: string) => {
		setTiers(tiers.filter((tier) => tier.id !== id));
	};

	// Save the tier list to Firestore
	const saveTierListOnClick = async () => {
		if (!listName.trim()) {
			setMessage('Please fill in the list name.');
			return;
		}
		if (items.some((item: TierListItemModel) => !item.value.trim())) {
			setMessage('Please ensure all items have a value or image URL.');
			return;
		}
		if (tiers.some((tier) => !tier.name.trim())) {
			setMessage('Please ensure all tiers have a name.');
			return;
		}
		if (items.length === 0) {
			setMessage('Add at least one item.');
			return;
		}

		setIsSaving(true);
		setMessage('');

		try {
			let newTierList = new TierList(
				user.uid,
				user.displayName || '',
				editorIds,
				serverTimestamp() as Timestamp,
				serverTimestamp() as Timestamp,
				listName,
				listDescription,
				tiers,
				items,
				new Map<string, TierListRankings>()
			);
			if (listId) {
				// We already created a tier list, update the updateable fields.
				await updateTierList(listId, newTierList, db);
				setMessage('Tier list updated successfully!');
				setIsSaving(false);
				return;
			} else {
				// Create a new tier list
				newTierList = await addTierList(newTierList, db);
				const newTierListId = newTierList.id;
				await updateUserTierList(newTierListId, user.uid, db);
				setMessage('Tier list saved successfully!');
				setIsSaving(false);
				setListId(newTierListId);
			}
		} catch (error: unknown) {
			console.error('Error saving tier list:', error);
			if (error instanceof Error) {
				setMessage(`Error saving tier list: ${error.message}`);
			}
			setIsSaving(false);
		}
	};

	const addEditorsDiv = (
		<div className='flex flex-col bg-gray-50 rounded-lg border border-gray-200 mb-2'>
			<h2 className='text-center text-xl'>Add Editors</h2>
			<div className='flex flex-col space-y-2 p-4'>
				{editorIds.map((user, index) => (
					<div key={index} className='flex items-center gap-2'>
						<Input
							label=''
							id={`user-${index}`}
							value={user}
							onChange={(e) => {
								const newEditorIds = [...editorIds];
								newEditorIds[index] = e.target.value;
								setEditorIds(newEditorIds);
							}}
							placeholder="Enter the user's ID"
							className='flex-grow'
						/>
						<i
							className='fas fa-trash trashcan-icon cursor-pointer'
							onClick={() => {
								const newEditorIds = editorIds.filter((_, i) => i !== index);
								setEditorIds(newEditorIds);
							}}
						></i>
					</div>
				))}
				<div className='flex justify-center'>
					<Button variant='primary' onClick={() => setEditorIds([...editorIds, ''])}>
						Add User
					</Button>
				</div>
			</div>
		</div>
	);

	const addItemDiv = (
		<div className='flex flex-col bg-gray-50 rounded-lg border border-gray-200 mb-2'>
			<h2 className='text-center text-xl'> Add An Item</h2>
			<div className='flex flex-col sm:flex-row gap-3 items-center justify-center'>
				<select
					value={currentAddItem.value}
					onChange={(e) => handleItemChange(currentAddItem.id, 'type', e.target.value)}
					className='p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto'
				>
					<option value='text'>Text</option>
					<option value='image'>Image URL</option>
				</select>
				{currentAddItem.type === 'text' ? (
					<Input
						label=''
						id={`item-text-${currentAddItem.id}`}
						value={currentAddItem.value}
						onChange={(e: { target: { value: string } }) =>
							handleCurrentItemChange('value', e.target.value)
						}
						placeholder='Item Name'
						className='flex-grow'
					/>
				) : (
					<Input
						label=''
						id={`item-image-${currentAddItem.id}`}
						value={currentAddItem.value}
						onChange={(e: { target: { value: string } }) =>
							handleCurrentItemChange('imageUrl', e.target.value)
						}
						placeholder='Image URL'
						className='flex-grow'
					/>
				)}
				<Button variant='primary' onClick={handleAddItem} className='px-8'>
					Add
				</Button>
			</div>
		</div>
	);

	const isCreator = creatorId === user.uid;
	const title = mode === TierListEditorMode.Create ? 'Create New Tier List' : 'Edit Tier List';

	return (
		<div className='bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto'>
			<h2 className='text-3xl font-bold mb-6 text-center'>{title}</h2>
			{message && (
				<div
					className={`p-3 mb-4 rounded-md text-center ${
						message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
					}`}
				>
					{message}
				</div>
			)}
			{listId ? (
				<Input
					label='Tier List Id'
					id='listId'
					value={listId}
					placeholder=''
					disabled={true}
					className='mb-2'
				/>
			) : null}
			<Input
				label='Tier List Name'
				id='listName'
				value={listName}
				onChange={(e: { target: { value: SetStateAction<string> } }) => setListName(e.target.value)}
				placeholder='e.g., Favorite Video Games'
				disabled={!isCreator}
				className='mb-2'
			/>
			<Input
				label='Description'
				id='listDescription'
				value={listDescription}
				onChange={(e: { target: { value: SetStateAction<string> } }) =>
					setListDescription(e.target.value)
				}
				placeholder='A brief description of your tier list.'
				disabled={!isCreator}
				className='mb-2'
			/>
			{addEditorsDiv}
			{addItemDiv}

			{/* Item Bank */}
			<div className='w-full h-full min-h-30 bg-gray-800 flex items-center justify-center'>
				{items.length === 0 ? (
					<span className='text-lg text-gray-50 font-semibold'>
						Items you add will show up here!
					</span>
				) : (
					<div className='pt-2 pl-2 pr-2 flex flex-wrap space-x-2'>
						{items.map((item: TierListItemModel, index) => (
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
								<input
									type='text'
									id={`tier-name-${tier.id}`}
									value={tier.name}
									onChange={(e: { target: { value: string } }) =>
										handleTierChange(tier.id, 'name', e.target.value)
									}
									placeholder='Tier Name'
									className='h-12 w-3/4 text-center'
								/>
							</div>
						</div>
						{/* Settings div */}
						<div className='h-full bg-black flex flex-col justify-center items-center space-y-2'>
							<input
								type='color'
								value={tier.color}
								onChange={(e) => handleTierChange(tier.id, 'color', e.target.value)}
								className='w-12 h-12 rounded-md border-0'
								title='Select Tier Color'
							/>
							{tiers.length > 1 && (
								<i
									className='fas fa-trash trashcan-icon text-white'
									onClick={() => handleRemoveTier(tier.id)}
								></i>
							)}
						</div>
					</div>
				))}
			</div>
			<Button variant='secondary' onClick={handleAddTier} className='mt-6 w-full'>
				Add Tier
			</Button>
			<div className='flex flex-col sm:flex-row justify-center gap-4 mt-8'>
				<Button onClick={saveTierListOnClick} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Tier List'}
				</Button>
			</div>
		</div>
	);
};

export { TierListEditor, TierListEditorMode };
