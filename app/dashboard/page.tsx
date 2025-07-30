'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../components/providers/FirebaseProvider';
import { ActionButton } from '../components/Button';
import {
	FirebaseReturnStatus,
	getUserTierLists,
	joinTierList,
	shouldRedirectToLogin,
} from '../firebase/firebase_utils';
import { TierList } from '../model/TierList';
import TierListItemCard from './components/TierListItemCard';
import NavBar from '../components/NavBar';
import Link from 'next/link';
import { Input } from '../components/Input';
import { usePopup } from '../components/providers/PopupProvider';
import { Page } from '../components/Page';

// Displays the create and join actions at the top of the page.
const ActionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return (
		<div className='flex flex-1 flex-col justify-center items-center rounded-lg border border-dashed border-black/25 w-full h-full space-y-2 pt-2 pb-4'>
			{children}
		</div>
	);
};

const joinDefaultText = 'Join Tierlist';

const DashboardPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const { showPopup } = usePopup();
	const router = useRouter();
	const [userTierLists, setUserTierLists] = React.useState<TierList[]>([]);
	const [joinTierListId, setJoinTierListId] = React.useState('');
	const [isLoadingTierLists, setIsLoadingTierLists] = React.useState(true);
	const [joinTierListText, setJoinTierListText] = React.useState(joinDefaultText);

	useEffect(() => {
		// User and DB are confirmed not null
		if (isLoading || !user || !db) {
			return;
		}
		setIsLoadingTierLists(true);

		getUserTierLists(user.uid, db).then((tierLists) => {
			setUserTierLists(tierLists);
			setIsLoadingTierLists(false);
		});
	}, [db, user, isLoading, router]);

	if (shouldRedirectToLogin(user, db, isLoading)) {
		router.push('/');
		return;
	}

	// User and DB are confirmed not null
	if (isLoading || !user || !db || isLoadingTierLists) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		);
	}

	const userCreatedTierLists = userTierLists.filter(
		(tierList: TierList) => tierList.creatorId === user.uid
	);
	const otherTierLists = userTierLists.filter(
		(tierList: TierList) => tierList.creatorId !== user.uid
	);

	const joinTierListOnClick = () => {
		if (joinTierListId) {
			setJoinTierListText('Joining...');
			joinTierList(joinTierListId, user.uid, db).then((status) => {
				if (status === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
					showPopup(`Tierlist ${joinTierListId} was not found.`, 'error');
				} else if (status === FirebaseReturnStatus.ALREADY_JOINED_TIERLIST_ERROR) {
					const tierlistName = userTierLists.find((t) => t.id === joinTierListId)?.name;
					showPopup(`You have already joined tierlist ${tierlistName}.`, 'error');
				} else {
					refreshTierLists();
				}
				setJoinTierListText(joinDefaultText);
			});
		} else {
			showPopup('Tierlist ID cannot be empty.', 'error');
		}
	};

	const refreshTierLists = () => {
		getUserTierLists(user.uid, db).then((tierLists) => {
			setUserTierLists(tierLists);
		});
	};

	return (
		<Page className='flex flex-col items-center'>
			<NavBar />
			<div className='flex justify-center items-center flex-1 flex-col px-8 mt-16 max-w-5xl'>
				<section className='flex w-full h-25 space-x-2 justify-center items-center'>
					<ActionHeader>
						<span className='text-xl w-fit h-fit text-center'> Create your own tierlist! </span>
						<Link href={'/dashboard/create'}>
							<ActionButton variant='primary'>Create New Tierlist</ActionButton>
						</Link>
					</ActionHeader>
					<ActionHeader>
						<span className='text-xl w-fit h-fit text-center'>
							Get a tierlist ID from a friend to join!
						</span>
						<div className='flex justify-center items-center space-x-2'>
							<Input
								label=''
								id={'join'}
								value={joinTierListId}
								onChange={(e) => setJoinTierListId(e.target.value)}
								placeholder='Tierlist ID'
								className='w-full p-2 border border-black rounded-md shadow-sm focus:border-indigo-500 sm:text-sm'
							/>
							<ActionButton onClick={joinTierListOnClick} variant='primary' className='h-fit'>
								{joinTierListText}
							</ActionButton>
						</div>
					</ActionHeader>
				</section>
				<section className='flex flex-1 flex-col w-full mx-16 mt-8 items-center'>
					<h1> Your Tierlists</h1>
					{userTierLists.length == 0 ? (
						<p className='text-gray-500 italic mt-4'>
							No tierlists found. Create one to get started!
						</p>
					) : (
						<div className='w-full space-y-2 px-16'>
							{userCreatedTierLists.map((tierList: TierList) => (
								<TierListItemCard
									key={tierList.id}
									tierList={tierList}
									refreshCallback={refreshTierLists}
								/>
							))}
							{otherTierLists.map((tierList: TierList) => (
								<TierListItemCard
									key={tierList.id}
									tierList={tierList}
									refreshCallback={refreshTierLists}
								/>
							))}
						</div>
					)}
				</section>
			</div>
		</Page>
	);
};

export default DashboardPage;
