import { SetStateAction, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from './Button';
import { Input } from './Input';
import { useFirebase } from './FirebaseProvider';

interface TierListCreatorProps {}

const generateUniqueId = () => {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

class TierListItem {
	id: string;
	type: 'text' | 'image';
	value: string;

	constructor(id: string, type: 'text' | 'image' = 'text', value: string = '') {
		this.id = id;
		this.type = type;
		this.value = value;
	}
}

const createNewTierListItem = () => {
	return new TierListItem(generateUniqueId(), 'text', '');
};

export default function TierListCreator({}: TierListCreatorProps) {
	const [listName, setListName] = useState('');
	const [listDescription, setListDescription] = useState('');
	// The current item we are trying to add
	const [currentAddItem, setCurrentAddItem] = useState(createNewTierListItem());

	const [items, setItems] = useState([]);
	const [tiers, setTiers] = useState([
		{ id: 's', name: 'S', color: '#FF7F7F' }, // Red
		{ id: 'a', name: 'A', color: '#FFBF7F' }, // Orange
		{ id: 'b', name: 'B', color: '#FFFF7F' }, // Yellow
		{ id: 'c', name: 'C', color: '#BFFF7F' }, // Light Green
		{ id: 'd', name: 'D', color: '#7FFFFF' }, // Light Blue
		{ id: 'f', name: 'F', color: '#BFBFFF' }, // Purple
	]);
	const [message, setMessage] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	const { db, user, firebaseConfig } = useFirebase();
	if (!user) {
		return null;
	}
	const userId = user.uid;

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
	const handleSaveTierList = async () => {
		if (!listName.trim()) {
			setMessage('Please fill in the list name.');
			return;
		}
		if (items.some((item: TierListItem) => !item.value.trim())) {
			setMessage('Please ensure all items have a value or image URL.');
			return;
		}
		if (tiers.some((tier) => !tier.name.trim())) {
			setMessage('Please ensure all tiers have a name.');
			return;
		}

		setIsSaving(true);
		setMessage('');

		try {
			const appId = firebaseConfig.appId;
			const tierListRef = collection(db, `tier_list`);

			const newTierList = {
				creatorId: userId,
				name: listName,
				description: listDescription,
				items: items.map((item: TierListItem) => ({
					id: item.id,
					type: item.type,
					value: item.value.trim(),
				})),
				tiers: tiers.map((tier) => ({
					id: tier.id,
					name: tier.name.trim(),
					color: tier.color,
				})),
				createdAt: serverTimestamp(),
			};

			await addDoc(tierListRef, newTierList);
			setMessage('Tier list saved successfully!');
			setListName('');
			setListDescription('');
			setItems([createNewTierListItem()]);
			setTiers([
				{ id: 's', name: 'S-Tier', color: '#FF7F7F' },
				{ id: 'a', name: 'A-Tier', color: '#FFBF7F' },
				{ id: 'b', name: 'B-Tier', color: '#FFFF7F' },
				{ id: 'c', name: 'C-Tier', color: '#BFFF7F' },
				{ id: 'd', name: 'D-Tier', color: '#7FFFFF' },
				{ id: 'f', name: 'F-Tier', color: '#BFBFFF' },
			]);
		} catch (error) {
			console.error('Error saving tier list:', error);
			setMessage(`Error saving tier list: ${error.message}`);
		} finally {
			setIsSaving(false);
		}
	};

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

	return (
		<div className='bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto'>
			<h2 className='text-3xl font-bold mb-6 text-center'>Create New Tier List</h2>
			{message && (
				<div
					className={`p-3 mb-4 rounded-md text-center ${
						message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
					}`}
				>
					{message}
				</div>
			)}
			<Input
				label='Tier List Name'
				id='listName'
				value={listName}
				onChange={(e: { target: { value: SetStateAction<string> } }) => setListName(e.target.value)}
				placeholder='e.g., Favorite Video Games'
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
				className='mb-2'
			/>
			{addItemDiv}

			{/* Item Bank */}
			<div className='w-full h-full min-h-30 bg-gray-800 flex items-center justify-center'>
				{items.length === 0 ? (
					<span className='text-lg text-gray-50 font-semibold'>
						Items you add will show up here!
					</span>
				) : (
					<div className='pt-2 pl-2 pr-2 flex flex-wrap space-x-2'>
						{items.map((item: TierListItem, index) => (
							<div
								key={item.id}
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
				<Button onClick={handleSaveTierList} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Tier List'}
				</Button>
			</div>
		</div>
	);
}
