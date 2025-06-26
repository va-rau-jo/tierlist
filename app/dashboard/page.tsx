'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For App Router navigation
import { AuthProvider, useAuth } from '../config/AuthContext';

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

	// If user is null after loading, it means they are not authenticated,
	// and the useEffect will handle the redirection. So we don't render anything
	// until redirected or user is confirmed.
	if (!user) {
		return null;
	}

	return (
		<AuthProvider>
			<div className='min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4'>
				<h1 className='text-4xl font-bold mb-6 text-gray-800'>
					Welcome to your Dashboard, {user.displayName || user.email}!
				</h1>
				{user.photoURL && (
					<img
						src={user.photoURL}
						alt='User Profile'
						className='w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4'
					/>
				)}
				<p className='text-lg text-gray-700 mb-2'>
					Your User ID: <span className='font-mono bg-gray-200 px-2 py-1 rounded'>{user.uid}</span>
				</p>
				<p className='text-lg text-gray-700 mb-6'>Email: {user.email}</p>

				<div className='flex space-x-4'>
					<button
						onClick={signOut}
						className='px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 ease-in-out'
					>
						Sign Out
					</button>
					{/* Add more dashboard specific buttons/links here */}
					<button
						onClick={() => router.push('/')}
						className='px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out'
					>
						Go to Home
					</button>
				</div>

				<div className='mt-8 text-gray-600 text-center'>
					<p>This is a protected dashboard page. You are logged in!</p>
					{/* You can add more dashboard content here */}
				</div>
			</div>
		</AuthProvider>
	);
};

export default DashboardPage;
