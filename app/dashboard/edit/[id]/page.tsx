'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TierListEditor, TierListEditorMode } from '@/app/components/TierListEditor';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { getTierList, shouldRedirectToLogin } from '@/app/firebase/firebase_utils';
import NavBar from '@/app/components/NavBar';
import { Page, PageBody } from '@/app/components/Page';

const EditPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const [isLoadingTierList, setIsLoadingTierList] = useState<boolean>(true);
	const tierListId = useParams().id?.toString();

	useEffect(() => {
		// User and DB are confirmed not null
		if (isLoading || !user || !tierListId || !db) {
			return;
		}

		setIsLoadingTierList(true);
		getTierList(tierListId, db).then((tierList) => {
			if (!tierList) {
				router.push('/dashboard');
			}
			setIsLoadingTierList(false);
		});
	}, [user, isLoading, router, tierListId, db]);

	if (shouldRedirectToLogin(user, db, isLoading)) {
		router.push('/');
		return null;
	}

	// User and DB are confirmed not null
	if (isLoading || !user || !db || isLoadingTierList) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		);
	}

	return (
		<Page>
			<NavBar />
			<PageBody>
				<TierListEditor mode={TierListEditorMode.Edit} tierListId={tierListId} />
			</PageBody>
		</Page>
	);
};

export default EditPage;
