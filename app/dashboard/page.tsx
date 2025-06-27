'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For App Router navigation
import { AuthProvider, useAuth } from '../config/AuthContext';
import TierListCreator from '../components/TierListCreator';

const DashboardPage: React.FC = () => {
	const { user, loading, signOut } = useAuth();
	const router = useRouter();

	// Protect the route: Redirect if not authenticated or still loading
	useEffect(() => {
		if (!loading && !user) {
			router.push('/'); // Redirect to your login page
		}
	}, [user, loading, router]); // Depend on user, loading, and router

	if (loading) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading dashboard...</p> {/* Or a spinner */}
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<AuthProvider>
			<div className='min-h-screen'>
				<div className='bg-gray-100 flex flex-row justify-between p-4'>
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
		</AuthProvider>
	);
};

export default DashboardPage;
