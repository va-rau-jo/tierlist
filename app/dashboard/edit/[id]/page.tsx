'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TierListCreator from '../../../components/TierListCreator';
import { useFirebase } from '../../../firebase/FirebaseProvider';
import { Button } from '../../../components/Button';
import { getTierList } from '../../../firebase/firebase_utils';
import { TierList } from '@/app/model/TierList';

const EditPage: React.FC = () => {
	const { db, isLoading, user, signOut } = useFirebase();
	const router = useRouter();
	const [tierList, setTierList] = useState<TierList>();
	const [isLoadingTierList, setIsLoadingTierList] = useState<boolean>(true);
	const tierListId = useParams().id;

	console.log(tierListId);

	useEffect(() => {
		// Protect the route: Redirect if not authenticated or still loading
		if (isLoading == false && !user) {
			router.push('/');
		}

		if (!tierListId || !db) {
			return;
		}

		setIsLoadingTierList(true);
		getTierList(tierListId, db).then((tierList) => {
			if (tierList) {
				setTierList(tierList);
			}
			setIsLoadingTierList(false);
		});
	}, [user, isLoading, router, tierListId, db]);

	if (isLoading || !user || isLoadingTierList) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		);
	}

	if (!tierList) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p className='text-2xl'>Could not find tierlist with ID: {tierListId}</p>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200'>
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
			<div>
				<TierListCreator />
			</div>
		</div>
	);
};

export default EditPage;
