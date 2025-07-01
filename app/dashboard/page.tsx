'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TierListCreator from '../components/TierListCreator';
import { useFirebase } from '../components/FirebaseProvider';

const DashboardPage: React.FC = () => {
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
					<button
						onClick={signOut}
						className='px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 ease-in-out'
					>
						Back
					</button>
				</div>
				<h1 className='text-4xl font-bold text-gray-800'>{user.displayName || user.email}</h1>
				<div className='flex space-x-4'>
					<button
						onClick={signOut}
						className='px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 ease-in-out'
					>
						Sign Out
					</button>
				</div>
			</div>
			<div>
				<TierListCreator />
			</div>
		</div>
	);
};

export default DashboardPage;
