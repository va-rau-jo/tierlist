'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../../firebase/FirebaseProvider';
import { TierListEditor, TierListEditorMode } from '../../components/TierListEditor';
import NavBar from '@/app/components/NavBar';

const CreatePage: React.FC = () => {
	const { isLoading, user } = useFirebase();
	const router = useRouter();

	useEffect(() => {
		// Protect the route: Redirect if not authenticated or still loading
		if (isLoading == false && !user) {
			router.push('/');
		}
	}, [user, isLoading, router]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className='min-h-screen bg-gradient-to-b from-orange-100 to-blue-200'>
			<NavBar />
			<div>
				<TierListEditor mode={TierListEditorMode.Create} />
			</div>
		</div>
	);
};

export default CreatePage;
