'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '../components/providers/FirebaseProvider';
import {
	FirebaseReturnStatus,
	updateUserName,
	shouldRedirectToLogin,
	doesUsernameExist,
} from '../firebase/firebase_utils';
import NavBar from '../components/NavBar';
import { Page } from '../components/Page';
import { usePopup } from '../components/providers/PopupProvider';
import { ActionButton, Button } from '../components/Button';
import { useUserNames } from '../components/providers/UserNamesProvider';

const DashboardPage: React.FC = () => {
	const { db, isLoading, user, signOut } = useFirebase();
	const router = useRouter();
	const { showPopup } = usePopup();
	const { fetchUserName, refreshUserName } = useUserNames();

	const [userName, setUserName] = useState<string>('');
	// The username when the page loads, check so we don't overwrite the already
	// set username
	const [startUserName, setStartUserName] = useState<string>('');

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
				setStartUserName(name);
			}
		});
	}, [db, user, isLoading, router, fetchUserName, startUserName]);

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

	const handleUpdateOnClick = async () => {
		if (!userName) {
			showPopup('Name cannot be empty.', 'error');
			return;
		}

		const usernameExists = await doesUsernameExist(userName, db);
		if (usernameExists) {
			showPopup('Username already exists.', 'error');
			return;
		}

		// Proceed with update if name is available
		const status = await updateUserName(user.uid, userName, db);
		if (status === FirebaseReturnStatus.OK) {
			await refreshUserName(user.uid);
			rerender();
			showPopup('Name updated successfully.', 'success');
		} else {
			showPopup('Failed to update name.', 'error');
		}
	};

	console.log(startUserName);
	console.log(userName);

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
							disabled={userName === startUserName}
							className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
						>
							Update
						</Button>
					</div>
					<ActionButton variant='danger' onClick={signOut}>
						Sign Out
					</ActionButton>
				</section>
			</div>
		</Page>
	);
};

export default DashboardPage;
