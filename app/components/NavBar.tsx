import Link from 'next/link';
import { useFirebase } from './providers/FirebaseProvider';
import HomeIcon from './icons/HomeIcon';
import UserIcon from './icons/UserIcon';

export default function NavBar() {
	const { user } = useFirebase();

	if (!user) {
		return null;
	}

	return (
		<div className='mb-2 flex flex-row px-4 py-2 w-full bg-gray-800'>
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
		</div>
	);
}
