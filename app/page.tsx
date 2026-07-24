'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './components/Button';
import { useFirebase } from './components/providers/FirebaseProvider';

const SignInPage: React.FC = () => {
	const router = useRouter();
	const { user, signIn } = useFirebase();

	useEffect(() => {
		if (user) {
			router.push('/dashboard');
		}
	}, [user, router]);

	return (
		<div className='relative flex min-h-screen flex-col overflow-hidden bg-slate-900'>
			<div
				aria-hidden
				className='pointer-events-none absolute inset-0 opacity-40'
				style={{
					backgroundImage:
						'linear-gradient(to right, rgb(71 85 105 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(71 85 105 / 0.35) 1px, transparent 1px)',
					backgroundSize: '4.5rem 4.5rem',
				}}
			/>
			<div
				aria-hidden
				className='pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl'
			/>
			<div
				aria-hidden
				className='pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl'
			/>

			<main className='relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center'>
				<p className='mb-4 text-sm font-medium uppercase tracking-[0.2em] text-indigo-300'>
					Collaborative ranking
				</p>
				<h1 className='text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl'>
					Tier Lists
				</h1>
				<p className='mt-4 max-w-md text-base text-slate-300 sm:text-lg'>
					Build boards, invite collaborators, and rank anything together.
				</p>
				<div className='mt-10'>
					<Button variant='primary' onClick={signIn} className='!rounded-lg !px-8 !shadow-lg'>
						Sign in to continue
					</Button>
				</div>
			</main>
		</div>
	);
};

export default SignInPage;
