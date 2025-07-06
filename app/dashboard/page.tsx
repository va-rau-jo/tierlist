'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../firebase/FirebaseProvider';
import { Button } from '../components/Button';
import { getUserTierLists, shouldRedirectToLogin } from '../firebase/firebase_utils';
import { TierList } from '../model/TierList';
import TierListItemCard from '../components/TierListItemCard';
import NavBar from '../components/NavBar';
import Link from 'next/link';

const DashboardPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const [userTierLists, setUserTierLists] = React.useState<TierList[]>([]);
	const [isLoadingTierLists, setIsLoadingTierLists] = React.useState(true);

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

	return (
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200 flex flex-col'>
			<NavBar />
			<div className=' flex justify-center items-center flex-1 flex-col'>
				<div className='flex h-fit space-x-2'>
					<Link href={'/dashboard/create'}>
						<Button variant='outline'>Create New Tierlist</Button>
					</Link>
					<Link href={'/dashboard/join'}>
						<Button variant='outline'>Join Tierlist</Button>
					</Link>
				</div>
				<div className='flex flex-1 justify-center w-full'>
					<div className='flex flex-col w-full mx-16 mt-16 items-center'>
						<h1> Your Tierlists</h1>
						<div className='flex'>
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
