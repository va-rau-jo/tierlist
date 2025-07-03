'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Button } from '../components/Button';
import { getUserTierLists } from '../firebase/firebase_utils';
import { TierList } from '../model/TierList';
import TierListItemCard from '../components/TierListItemCard';

const DashboardPage: React.FC = () => {
	const { db, isLoading, user, signOut } = useFirebase();
	const router = useRouter();
	const [userTierLists, setUserTierLists] = React.useState<TierList[]>([]);
	const [isLoadingTierLists, setIsLoadingTierLists] = React.useState(true);

	useEffect(() => {
		// Protect the route: Redirect if not authenticated or still loading
		if (isLoading == false && !user) {
			router.push('/');
			return;
		}
		if (isLoading || !user || !db) {
			return;
		}
		setIsLoadingTierLists(true);

		getUserTierLists(user.uid, db).then((tierLists) => {
			setUserTierLists(tierLists);
			setIsLoadingTierLists(false);
		});
	}, [db, user, isLoading, router]);

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

	return (
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200 flex flex-col'>
			<div className='mb-2 flex flex-row justify-between p-4'>
				<div className='flex space-x-4'>
					<Button
						variant='danger'
						onClick={() => {
							router.push('/dashboard');
						}}
					>
						Back
					</Button>
				</div>
				<h1 className='text-4xl font-bold text-gray-800'>{user.displayName || user.email}</h1>
				<div className='flex space-x-4'>
					<Button variant='danger' onClick={signOut}>
						Sign Out
					</Button>
				</div>
			</div>
			<div className=' flex justify-center items-center flex-1 flex-col'>
				<div className='flex h-fit space-x-2'>
					<Button variant='outline' onClick={() => router.push('/dashboard/create')}>
						Create New Tierlist
					</Button>
					<Button variant='outline' onClick={() => router.push('/dashboard/join')}>
						Join Tierlist
					</Button>
				</div>
				<div className='flex flex-1'>
					<div>
						<h1> Your Tierlists</h1>
						<div>
							{userTierLists.length == 0 ? (
								<p className='text-gray-500 italic mt-4'>
									No tierlists found. Create one to get started!
								</p>
							) : (
								<div>
									{userCreatedTierLists.map((tierList: TierList) => (
										<TierListItemCard key={tierList.id} tierList={tierList} />
									))}
									{otherTierLists.map((tierList: TierList) => (
										<TierListItemCard key={tierList.id} tierList={tierList} />
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardPage;
