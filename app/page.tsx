'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from './components/Button';
import { useFirebase } from './components/providers/FirebaseProvider';
import { BASE_PATH } from './constants';

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

			<main className='relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:items-center lg:gap-12 lg:py-24'>
				<div className='flex max-w-md flex-col items-center text-center lg:items-start lg:text-left'>
					<p className='mb-4 text-sm font-medium uppercase tracking-[0.2em] text-indigo-300'>
						Collaborative ranking
					</p>
					<h1 className='text-5xl font-bold tracking-tight text-white sm:text-6xl'>Tier Lists</h1>
					<p className='mt-4 max-w-md text-base text-slate-300 sm:text-lg'>
						Build tierlists, invite collaborators, and rank anything together.
					</p>
					<div className='mt-10'>
						<Button variant='primary' onClick={signIn} className='!rounded-lg !px-8 !shadow-lg'>
							Sign in with Google
						</Button>
					</div>
				</div>

				<div className='w-full max-w-sm shrink-0 lg:max-w-md'>
					<div className='rotate-1 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur transition-transform duration-300 hover:rotate-0'>
						<div className='overflow-hidden rounded-xl border border-slate-700/50'>
							<Image
								src={`${BASE_PATH}/preview.png`}
								alt='A tier list ranking fast food restaurants from S to F tier'
								width={652}
								height={810}
								className='h-auto w-full'
								priority
							/>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default SignInPage;
