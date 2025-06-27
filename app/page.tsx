'use client';
import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from './config/firebase_config';

const App: React.FC = () => {
	const router = useRouter();
	const googleProvider = new GoogleAuthProvider();

	const handleSignUp = async () => {
		try {
			const userCredential = await signInWithPopup(auth, googleProvider);
			const user = userCredential.user;
			console.log('User signed up:', user.email);
			console.log(user);
			router.push('/dashboard');
		} catch (error: unknown) {
			if (error instanceof Error) {
				const errorMessage = error.message;
				console.error('Error signing up:', errorMessage);
			}
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 p-6 font-inter text-gray-800'>
			<div>
				<h1 className='text-4xl font-bold text-purple-700'>Tier List App</h1>
			</div>
			<div>
				<button
					className='bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75'
					onClick={handleSignUp}
				>
					Sign Up
				</button>
			</div>
		</div>
	);
};

export default App;
