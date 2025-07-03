'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TierListCreator from '../../components/TierListCreator';
import { useFirebase } from '../../firebase/FirebaseProvider';
import { Button } from '../../components/Button';

const CreatePage: React.FC = () => {
	const { isLoading, user, signOut } = useFirebase();
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

export default CreatePage;
