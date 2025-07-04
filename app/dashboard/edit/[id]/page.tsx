'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TierListEditor, TierListEditorMode } from '@/app/components/TierListEditor';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import { getTierList } from '@/app/firebase/firebase_utils';
import { TierList } from '@/app/model/TierList';
import NavBar from '@/app/components/NavBar';

const EditPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const [tierList, setTierList] = useState<TierList>();
	const [isLoadingTierList, setIsLoadingTierList] = useState<boolean>(true);
	const tierListId = useParams().id?.toString();

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
			<NavBar />
			<div>
				<TierListEditor mode={TierListEditorMode.Edit} tierListId={tierListId} />
			</div>
		</div>
	);
};

export default EditPage;
