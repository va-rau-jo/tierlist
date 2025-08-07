import { SetStateAction, useEffect, useState } from 'react';
import { ActionButton, Button } from './Button';
import { Input } from './Input';
import { useFirebase } from './providers/FirebaseProvider';
import { TierListItemModel } from '../model/TierListItem';
import {
	addTierList,
	getTierList,
	updateTierList,
	FirebaseReturnStatus,
} from '../firebase/firebase_utils';
import { TierList, TierListRankings } from '../model/TierList';
import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { Tier } from '../model/Tier';
import { generateUniqueId } from '../utils';
import { MAX_ITEM_SIZE, TIER_ITEM_HEIGHT } from '../constants';
import { usePopup } from './providers/PopupProvider';
import { useRouter } from 'next/navigation';
import RenderedItem from '../dashboard/rank/components/RenderedItem';
import { useUserNames } from './providers/UserNamesProvider';

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
	return new TierListItemModel(generateUniqueId(), '', '');
};

const createNewTier = (name: string, color: string) => {
	return new Tier(generateUniqueId(), name, color);
};

const TierListEditor: React.FC<TierListEditorProps> = ({ mode, tierListId }) => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const { showPopup } = usePopup();
	const { getUserName, fetchUserName } = useUserNames();

	// Settable tier list values
	const [listName, setListName] = useState('');
	const [listDescription, setListDescription] = useState('');
	const [isPrivate, setIsPrivate] = useState(true);
	const [creatorId, setCreatorId] = useState(user?.uid);
	const [editorIds, setEditorIds] = useState<string[]>([]);
	const [rankerIds, setRankerIds] = useState<string[]>([]);

	// The current item we are trying to add
	const [currentAddItem, setCurrentAddItem] = useState(createNewTierListItem());
	const [currentEditItem, setCurrentEditItem] = useState<TierListItemModel | undefined>();

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
	// Replaces save button if we are saving.
	const [isSaving, setIsSaving] = useState(false);
	// Id of the created tier list (so we don't re-create instead of overwriting).
	const [listId, setListId] = useState(tierListId);
	const [isLoadingTierList, setIsLoadingTierList] = useState(true);

	// Trigger if we need to rerender
	const rerender = () => _setRender(_render + 1);
	const [_render, _setRender] = useState(0);

	useEffect(() => {
		if (isLoading || !user || !db) {
			// If user/db/isLoading are missing/true, Firebase is not ready.
			return;
		}

		const fetchTierList = async () => {
			if (mode == TierListEditorMode.Create) {
				setEditorIds([user.uid]);
				// Set current user's name as editor
				await fetchUserName(user.uid);
			} else if (mode === TierListEditorMode.Edit && listId) {
				const tierList = await getTierList(listId, db);
				if (tierList === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
					return;
				}
				setListName(tierList.name);
				setListDescription(tierList.description);
				setItems(tierList.items);
				setTiers(tierList.tiers);
				setCreatorId(tierList.creatorId);
				const editorIdArray = Array.from(tierList.editorIds);
				setEditorIds(editorIdArray);
				const rankerIdArray = Array.from(tierList.rankerIds);
				setRankerIds(rankerIdArray);
				await Promise.all([
					...editorIdArray.map((id) => fetchUserName(id)),
					...rankerIdArray.map((id) => fetchUserName(id)),
				]);
			} else {
				throw Error('Unexpected error / tier list editor mode.');
			}
			setIsLoadingTierList(false);
		};

		fetchTierList();
	}, [mode, listId, db, user, isLoading, router, fetchUserName]);

	if (!user || !db) {
		return null;
	}

	if (isLoadingTierList) {
		return <div>Loading...</div>;
	}

	// Add a new item input field
	const addItem = () => {
		if (!currentAddItem.name) {
			showPopup('Item name is required.', 'error');
		} else if (currentAddItem.imageUrl && !currentAddItem.imageUrl.startsWith('http')) {
			showPopup('Invalid URL provided.', 'error');
		} else {
			setItems([...items, currentAddItem]);
			setCurrentAddItem(createNewTierListItem());
		}
	};

	const updateEditItem = () => {
		if (!currentEditItem) {
			showPopup('No item to edit.', 'error');
			return;
		} else if (!currentEditItem.name) {
			showPopup('Item name is required.', 'error');
		} else if (currentEditItem.imageUrl && !currentEditItem.imageUrl.startsWith('http')) {
			showPopup('Invalid URL provided.', 'error');
		} else {
			setItems(items.map((item) => (item.id === currentEditItem.id ? currentEditItem : item)));
			setCurrentEditItem(undefined);
		}
	};

	// Update current add item value (text or image URL)
	const handleCurrentAddItemChange = (field: string, value: string) => {
		setCurrentAddItem((prev) => ({ ...prev, [field]: value }));
	};

	// Update current edit item's values. Item is guaranteed to be defined.
	const handleCurrentEditItemChange = (field: string, value: string) => {
		setCurrentEditItem((prev) => {
			if (prev) {
				return { ...prev, [field]: value };
			}
		});
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
			showPopup('Please give the tier list a name.', 'error');
			return;
		}
		if (tiers.some((tier) => !tier.name.trim())) {
			showPopup('Please give all tiers a name.', 'error');
			return;
		}

		setIsSaving(true);
		const filterIds = (ids: string[]) => {
			return ids.filter((x) => x !== '' && x !== user.uid && typeof getUserName(x) === 'string');
		};
		const newEditorIds = filterIds(editorIds);
		const newRankerIds = filterIds(rankerIds);
		setEditorIds(newEditorIds);
		setRankerIds(newRankerIds);

		let newTierList = new TierList(
			user.uid,
			user.displayName || '',
			isPrivate,
			new Set(newEditorIds),
			new Set(newRankerIds),
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
			updateTierList(listId, newTierList, db).then((status) => {
				if (status !== FirebaseReturnStatus.OK) {
					showPopup(`Error occurred updating the tierlist: ${status}`, 'error');
				} else {
					showPopup('Tier list updated successfully!', 'success');
					setIsSaving(false);
					// If no longer an editor, leave the page.
					if (user.uid !== creatorId && !editorIds.includes(user.uid)) {
						router.push('/dashboard');
					}
				}
			});
		} else {
			// Create a new tier list, update Firebase set fields like tierlist id.
			addTierList(newTierList, user, db).then((returnedTierList) => {
				if (returnedTierList === FirebaseReturnStatus.TIERLIST_NOT_CREATED_ERROR) {
					showPopup('Tier list could not be created.', 'error');
				} else if (returnedTierList instanceof TierList) {
					newTierList = returnedTierList;
					showPopup('Tier list created successfully!', 'success');
					setListId(newTierList.id);
				}
				setIsSaving(false);
			});
		}
	};

	const handleEditorIdsChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
		const newEditorId = e.target.value;
		const newEditorIds = [...editorIds];
		newEditorIds[index] = newEditorId;
		setEditorIds(newEditorIds);
		fetchUserName(newEditorId).then(() => rerender());
	};

	const handleRankerIdsChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
		const newRankerId = e.target.value;
		const newRankerIds = [...rankerIds];
		newRankerIds[index] = newRankerId;
		setRankerIds(newRankerIds);
		fetchUserName(newRankerId).then(() => rerender());
	};

	const renderUserNameMessage = (userId: string) => {
		if (!userId) {
			return null;
		}
		const userName = getUserName(userId);
		if (typeof userName === 'string') {
			return <span className='text-green-600'> {userName} </span>;
		} else {
			return <span className='text-red-500'> User Not Found </span>;
		}
	};

	const editorContainerStyle =
		'flex flex-1 flex-col bg-gray-50 rounded-lg border border-gray-200 mb-2';

	const addEditorsDiv = (
		<div className={editorContainerStyle}>
			<h2 className='text-center text-xl'>Add Editors</h2>
			<div className='flex flex-col flex-1 space-y-2 p-4'>
				{editorIds.map((userId, index) => (
					<div key={index} className='flex items-center gap-2 ml-8'>
						<i
							className={`fas fa-trash trashcan-icon cursor-pointer ${
								index === 0 ? 'invisible' : ''
							}`}
							onClick={() => {
								const newEditorIds = editorIds.filter((_, i) => i !== index);
								setEditorIds(newEditorIds);
							}}
						/>
						<Input
							label=''
							id={`user-${index}`}
							value={userId}
							onChange={(e) => handleEditorIdsChange(e, index)}
							placeholder="Enter the user's ID"
							additionalClassNames='flex-grow'
							disabled={index === 0}
						/>
						{renderUserNameMessage(userId)}
					</div>
				))}
				<div className='flex justify-center'>
					<ActionButton variant='outline' onClick={() => setEditorIds([...editorIds, ''])}>
						Add New Editor
					</ActionButton>
				</div>
			</div>
		</div>
	);

	const addRankersDiv = (
		<div className={editorContainerStyle}>
			<h2 className='text-center text-xl'>Add Rankers</h2>
			<div className='flex flex-col flex-1 space-y-2 p-4'>
				{rankerIds.map((userId, index) => (
					<div key={index} className='flex items-center gap-2 ml-8'>
						<i
							className='fas fa-trash trashcan-icon cursor-pointer'
							onClick={() => {
								const newRankerIds = rankerIds.filter((_, i) => i !== index);
								setRankerIds(newRankerIds);
							}}
						></i>
						<Input
							label=''
							id={`user-${index}`}
							value={userId}
							onChange={(e) => handleRankerIdsChange(e, index)}
							placeholder="Enter the user's ID"
							additionalClassNames='flex-grow'
						/>
						{renderUserNameMessage(userId)}
					</div>
				))}
				<div className='flex justify-center'>
					<ActionButton variant='outline' onClick={() => setRankerIds([...rankerIds, ''])}>
						Add New Ranker
					</ActionButton>
				</div>
			</div>
		</div>
	);

	const itemAddingOrEditing = currentEditItem ? currentEditItem : currentAddItem;
	const addItemDiv = (
		<div className='flex flex-col bg-gray-50 rounded-lg border border-gray-200 mb-2'>
			<h2 className='text-center text-xl'> {currentEditItem ? 'Edit Item' : 'Add An Item'}</h2>
			<div className='flex flex-col sm:flex-row gap-3 items-center justify-center'>
				<Input
					label=''
					id={`item-text-${itemAddingOrEditing.id}`}
					value={itemAddingOrEditing.name}
					onChange={(e: { target: { value: string } }) => {
						const handler = currentEditItem
							? handleCurrentEditItemChange
							: handleCurrentAddItemChange;
						handler('name', e.target.value);
					}}
					placeholder='Item Name (Required)'
					additionalClassNames='flex-grow'
				/>
				<Input
					label=''
					id={`item-image-${itemAddingOrEditing.id}`}
					value={itemAddingOrEditing.imageUrl}
					onChange={(e: { target: { value: string } }) => {
						const handler = currentEditItem
							? handleCurrentEditItemChange
							: handleCurrentAddItemChange;
						handler('imageUrl', e.target.value);
					}}
					placeholder='Image URL (Optional)'
					additionalClassNames='flex-grow'
				/>
				<ActionButton
					variant='outline'
					onClick={() => {
						const handler = currentEditItem ? updateEditItem : addItem;
						handler();
					}}
					className='px-6'
				>
					{currentEditItem ? 'Update Item' : 'Add Item'}
				</ActionButton>
			</div>
		</div>
	);

	const isCreator = creatorId === user.uid;
	const title = mode === TierListEditorMode.Create ? 'Create New Tier List' : 'Edit Tier List';

	return (
		<div>
			<h2 className='text-3xl font-bold mb-6 text-center'>{title}</h2>
			{listId && (
				<Input
					label='Tier List Id'
					id='listId'
					value={listId}
					placeholder=''
					disabled={true}
					additionalClassNames='mb-2'
				/>
			)}
			<div className='flex justify-center items-center space-x-8'>
				<Input
					label='Tier List Name'
					id='listName'
					value={listName}
					onChange={(e: { target: { value: SetStateAction<string> } }) =>
						setListName(e.target.value)
					}
					placeholder='e.g., Favorite Video Games'
					disabled={!isCreator}
					additionalClassNames='mb-2'
				/>
				<div className='flex items-center gap-4'>
					<span className='text-sm font-medium'>Public</span>
					<label className='relative inline-flex items-center cursor-pointer'>
						<input
							type='checkbox'
							className='sr-only peer'
							checked={isPrivate}
							onChange={() => setIsPrivate(!isPrivate)}
						/>
						<div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
					</label>
					<span className='text-sm font-medium'>Private</span>
				</div>
			</div>

			<Input
				label='Description'
				id='listDescription'
				value={listDescription}
				onChange={(e: { target: { value: SetStateAction<string> } }) =>
					setListDescription(e.target.value)
				}
				placeholder='A brief description of your tier list.'
				disabled={!isCreator}
				additionalClassNames='mb-2'
			/>
			<div className='flex justify-center space-x-4'>
				{addEditorsDiv} {addRankersDiv}
			</div>
			{addItemDiv}
			{/* Item Bank */}
			<div className='w-full h-full min-h-30 bg-gray-800 flex items-center justify-center'>
				{items.length === 0 ? (
					<span className='text-lg text-gray-50 font-semibold'>
						Items you add will show up here!
					</span>
				) : (
					<div className='pt-2 pl-2 pr-2 flex flex-wrap'>
						{items.map((item: TierListItemModel, index) => (
							<div key={index} className='relative group mb-2 mr-2'>
								<RenderedItem item={item} itemSize={MAX_ITEM_SIZE} isDraggable={false} />
								<i
									className='fas fa-pencil absolute text-sm bottom-0 left-0 cursor-pointer opacity-100 group-hover:opacity-100 transition-opacity hover:bg-gray-300 hover:rounded-full p-1'
									onClick={() => setCurrentEditItem(item)}
								></i>
								<i
									className='fas fa-trash absolute text-sm bottom-0 right-0 cursor-pointer opacity-100 group-hover:opacity-100 transition-opacity hover:bg-gray-300 hover:rounded-full p-1'
									onClick={() => setItems(items.filter((_, i) => i !== index))}
								></i>
							</div>
						))}
					</div>
				)}
			</div>

			<div className='space-y-1 bg-black p-1'>
				{/* Tiers */}
				{tiers.map((tier) => (
					<div className={`'h-${TIER_ITEM_HEIGHT} flex`} key={tier.id}>
						<div className='flex grow-1 sm:flex-row gap-3 items-center bg-[#404040]'>
							<div
								className={`h-${TIER_ITEM_HEIGHT} aspect-square flex items-center justify-center`}
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
			<div className='fixed flex justify-center bottom-4 right-8'>
				<Button onClick={saveTierListOnClick} disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Tier List'}
				</Button>
			</div>
		</div>
	);
};

export { TierListEditor, TierListEditorMode };
