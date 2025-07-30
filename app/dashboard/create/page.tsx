'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../../components/providers/FirebaseProvider';
import { TierListEditor, TierListEditorMode } from '../../components/TierListEditor';
import NavBar from '@/app/components/NavBar';
import { Page, PageBody } from '@/app/components/Page';

const CreatePage: React.FC = () => {
	const { isLoading, user } = useFirebase();
	const router = useRouter();

	if (!user) {
		router.push('/');
		return;
	}

	if (isLoading) {
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
				<TierListEditor mode={TierListEditorMode.Create} />
			</PageBody>
		</Page>
	);
};

export default CreatePage;
