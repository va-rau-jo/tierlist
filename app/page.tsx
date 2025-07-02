'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './components/Button';
import { useFirebase } from './firebase/FirebaseProvider';

const SignInPage: React.FC = () => {
	const router = useRouter();
	const { user, signIn } = useFirebase();

	// Redirect if already signed in
	useEffect(() => {
		if (user) {
			router.push('/dashboard'); // Or wherever your main app dashboard is
		}
	}, [user, router]);

	return (
		<div className='min-h-screen space-y-4 flex flex-col justify-center text-center bg-gradient-to-b from-orange-100 to-blue-200'>
			<h1 className='text-8xl'>Tier Lists</h1>
			<div>
				<Button variant='primary' onClick={signIn}>
					Sign In
				</Button>
			</div>
		</div>
	);
};

export default SignInPage;
