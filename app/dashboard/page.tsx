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

const JOIN_BUTTON_DEFAULT_TEXT = 'Join';
const JOIN_BUTTON_JOINING_TEXT = 'Joining...';

interface BoardColumnProps {
	title: string;
	count: number;
	children: React.ReactNode;
	emptyMessage: string;
	isEmpty: boolean;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
	title,
	count,
	children,
	emptyMessage,
	isEmpty,
}) => {
	return (
		<section className='flex min-h-[28rem] min-w-0 flex-1 flex-col rounded-xl bg-[var(--board-column)]/80 p-3'>
			<header className='mb-3 flex items-center justify-between gap-2 px-1'>
				<h2 className='min-w-0 truncate text-sm font-semibold uppercase tracking-wide text-slate-600'>
					{title}
				</h2>
				<span className='shrink-0 rounded-full bg-slate-500/15 px-2 py-0.5 text-xs font-medium text-slate-600'>
					{count}
				</span>
			</header>
			<div className='flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto'>
				{isEmpty ? (
					<p className='px-1 py-8 text-center text-sm text-slate-500'>{emptyMessage}</p>
				) : (
					children
				)}
			</div>
		</section>
	);
};

const DashboardPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const { showPopup } = usePopup();
	const router = useRouter();
	const [userTierLists, setUserTierLists] = React.useState<TierList[]>([]);
	const [joinTierListId, setJoinTierListId] = React.useState('');
	const [isLoadingTierLists, setIsLoadingTierLists] = React.useState(true);
	const [joinTierListText, setJoinTierListText] = React.useState(JOIN_BUTTON_DEFAULT_TEXT);

	useEffect(() => {
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

	if (isLoading || !user || !db || isLoadingTierLists) {
		return (
			<Page className='flex flex-col'>
				<NavBar />
				<div className='flex flex-1 items-center justify-center'>
					<p className='text-sm text-slate-500'>Loading...</p>
				</div>
			</Page>
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
			setJoinTierListText(JOIN_BUTTON_JOINING_TEXT);
			joinTierList(joinTierListId, user.uid, db).then((status) => {
				if (status === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
					showPopup(`Tierlist ${joinTierListId} was not found.`, 'error');
				} else if (status === FirebaseReturnStatus.ALREADY_JOINED_TIERLIST_ERROR) {
					const tierlistName = userTierLists.find((t) => t.id === joinTierListId)?.name;
					showPopup(`You have already joined tierlist ${tierlistName}.`, 'error');
				} else {
					refreshTierLists();
				}
				setJoinTierListText(JOIN_BUTTON_DEFAULT_TEXT);
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
		<Page className='flex flex-col'>
			<NavBar />
			<main className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6'>
				<div className='flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
					<div className='min-w-0'>
						<h1 className='truncate text-lg font-semibold text-slate-900'>Your Tierlists</h1>
						<p className='text-sm text-slate-500'>Create a list or join one with an ID.</p>
					</div>
					<div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center'>
						<Link href='/dashboard/create' className='shrink-0'>
							<ActionButton variant='primary' className='w-full sm:w-auto'>
								Create tier list
							</ActionButton>
						</Link>
						<div className='flex min-w-0 flex-1 items-center gap-2'>
							<div className='min-w-0 flex-1'>
								<Input
									label=''
									id='join'
									value={joinTierListId}
									onChange={(e) => setJoinTierListId(e.target.value)}
									placeholder='Paste tier list ID'
									className='w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-none focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
								/>
							</div>
							<ActionButton onClick={joinTierListOnClick} variant='secondary' className='shrink-0'>
								{joinTierListText}
							</ActionButton>
						</div>
					</div>
				</div>

				<div className='grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2'>
					<BoardColumn
						title='Created by you'
						count={userCreatedTierLists.length}
						isEmpty={userCreatedTierLists.length === 0}
						emptyMessage='No lists yet. Create one to get started.'
					>
						{userCreatedTierLists.map((tierList: TierList) => (
							<TierListItemCard
								key={tierList.id}
								tierList={tierList}
								refreshCallback={refreshTierLists}
							/>
						))}
					</BoardColumn>
					<BoardColumn
						title='Shared with you'
						count={otherTierLists.length}
						isEmpty={otherTierLists.length === 0}
						emptyMessage='Join a list with an ID from a friend.'
					>
						{otherTierLists.map((tierList: TierList) => (
							<TierListItemCard
								key={tierList.id}
								tierList={tierList}
								refreshCallback={refreshTierLists}
							/>
						))}
					</BoardColumn>
				</div>
			</main>
		</Page>
	);
};

export default DashboardPage;
