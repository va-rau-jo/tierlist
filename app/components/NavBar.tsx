import { ActionButton } from './Button';
import { useFirebase } from './providers/FirebaseProvider';
import Link from 'next/link';
import { usePopup } from './providers/PopupProvider';

export default function NavBar() {
	const { user, signOut } = useFirebase();
	const { showPopup } = usePopup();

	if (!user) {
		return null;
	}

	return (
		<div className='mb-2 flex flex-row justify-between px-4 py-2 w-full bg-gray-800'>
			<div className='flex space-x-4'>
				<Link href={'/dashboard'}>
					<ActionButton variant='danger'>Back</ActionButton>
				</Link>
			</div>
			<h1 className='flex text-4xl sm:text-2xl font-bold text-white'>
				{user.displayName}{' '}
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
