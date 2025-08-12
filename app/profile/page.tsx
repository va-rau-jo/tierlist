'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../components/providers/FirebaseProvider';
import {
	FirebaseReturnStatus,
	updateUserName,
	shouldRedirectToLogin,
} from '../firebase/firebase_utils';
import NavBar from '../components/NavBar';
import { Page } from '../components/Page';
import { usePopup } from '../components/providers/PopupProvider';
import { Button } from '../components/Button';
import { useUserNames } from '../components/providers/UserNamesProvider';

const DashboardPage: React.FC = () => {
	const { db, isLoading, user } = useFirebase();
	const router = useRouter();
	const { showPopup } = usePopup();
	const { fetchUserName, refreshUserName } = useUserNames();

	const [userName, setUserName] = useState<string>('');

	const rerender = () => _setRender(_render + 1);
	const [_render, _setRender] = useState(0);

	useEffect(() => {
		// User and DB are confirmed not null
		if (isLoading || !user || !db) {
			return;
		}

		fetchUserName(user.uid).then((name) => {
			if (typeof name === 'string') {
				setUserName(name);
			}
		});
	}, [db, user, isLoading, router, fetchUserName]);

	if (shouldRedirectToLogin(user, db, isLoading)) {
		router.push('/');
		return;
	}

	// User and DB are confirmed not null
	if (isLoading || !user || !db) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<p>Loading...</p>
			</div>
		);
	}

	const handleUpdateOnClick = () => {
		if (userName) {
			updateUserName(user.uid, userName, db).then((status) => {
				if (status === FirebaseReturnStatus.OK) {
					refreshUserName(user.uid).then(() => {
						rerender();
						showPopup('Name updated successfully.', 'success');
					});
				} else {
					showPopup('Failed to update name.', 'error');
				}
			});
		} else {
			showPopup('Name cannot be empty.', 'error');
		}
	};

	return (
		<Page className='flex flex-col items-center'>
			<NavBar />
			<div
				className='flex justify-center items-center flex-1 flex-col px-8 mt-16 max-w-5xl'
				style={{ maxWidth: '95vw' }}
			>
				<section className='flex w-full h-25 space-x-2 justify-center items-center flex-col gap-4'>
					<h2 className='text-xl font-semibold'>Change Name</h2>
					<div className='flex gap-2'>
						<input
							type='text'
							className='px-4 py-2 border rounded-lg'
							placeholder={userName}
							onChange={(e) => setUserName(e.target.value)}
							value={userName}
						/>
						<Button
							variant='primary'
							onClick={handleUpdateOnClick}
							className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
						>
							Update
						</Button>
					</div>
				</section>
			</div>
		</Page>
	);
};

export default DashboardPage;
