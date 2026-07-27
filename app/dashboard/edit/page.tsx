'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TierListEditor, TierListEditorMode } from '@/app/components/TierListEditor';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { getTierList, shouldRedirectToLogin } from '@/app/firebase/firebase_utils';
import NavBar from '@/app/components/NavBar';
import { Page, PageBody } from '@/app/components/Page';

const EditPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const [isLoadingTierList, setIsLoadingTierList] = useState<boolean>(true);
	const tierListId = useSearchParams().get('id') ?? undefined;

	useEffect(() => {
		// No ID in the URL, this page has nothing to show.
		if (!tierListId) {
			router.push('/dashboard');
		}
	}, [tierListId, router]);

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

const EditPageWrapper: React.FC = () => (
	<Suspense
		fallback={
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		}
	>
		<EditPage />
	</Suspense>
);

export default EditPageWrapper;
