'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../../firebase/FirebaseProvider';
import { TierListEditor, TierListEditorMode } from '../../components/TierListEditor';
import NavBar from '@/app/components/NavBar';
import { PageBody } from '@/app/components/PageBody';

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
		<PageBody>
			<NavBar />
			<div>
				<TierListEditor mode={TierListEditorMode.Create} />
			</div>
		</PageBody>
	);
};

export default CreatePage;
