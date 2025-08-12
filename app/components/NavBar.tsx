import { ActionButton } from './Button';
import { useFirebase } from './providers/FirebaseProvider';
import Link from 'next/link';
import { usePopup } from './providers/PopupProvider';
import HomeIcon from './icons/HomeIcon';
import UserIcon from './icons/UserIcon';
import { useEffect } from 'react';
import { useUserNames } from './providers/UserNamesProvider';

export default function NavBar() {
	const { db, user, signOut } = useFirebase();
	const { showPopup } = usePopup();
	const { fetchUserName, getUserName } = useUserNames();

	useEffect(() => {
		if (!user || !db) {
			return;
		}

		fetchUserName(user.uid);
	}, [db, fetchUserName, user]);

	if (!user) {
		return null;
	}

	let userName = getUserName(user.uid);
	if (typeof userName !== 'string') {
		userName = user.displayName || '';
	}

	return (
		<div className='mb-2 flex flex-row justify-between px-4 py-2 w-full bg-gray-800'>
			<div className='flex'>
				<Link
					href='/dashboard'
					className='flex items-center text-white hover:text-gray-200 hover:bg-gray-700 rounded-lg p-2'
				>
					<HomeIcon />
				</Link>
				<Link
					href='/profile'
					className='flex items-center text-white hover:text-gray-200 hover:bg-gray-700 rounded-lg p-2 ml-2'
				>
					<UserIcon />
				</Link>
			</div>
			<h1 className='flex items-center text-4xl sm:text-2xl font-bold text-white'>
				{userName}
				<span
					className='text-lg sm:text-sm my-auto text-white ml-4 cursor-pointer hover:text-gray-200'
					onClick={() => {
						navigator.clipboard.writeText(user.uid);
						showPopup('User ID copied.', 'info');
					}}
					title='Click to copy ID'
				>
					{user.uid}
				</span>
			</h1>
			<div className='flex space-x-4'>
				<ActionButton variant='danger' onClick={signOut}>
					Sign Out
				</ActionButton>
			</div>
		</div>
	);
}
