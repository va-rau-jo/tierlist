import { Button } from './Button';
import { useFirebase } from '../firebase/FirebaseProvider';
import Link from 'next/link';

export default function NavBar() {
	const { user, signOut } = useFirebase();

	if (!user) {
		return null;
	}

	return (
		<div className='mb-2 flex flex-row justify-between p-4 w-full'>
			<div className='flex space-x-4'>
				<Link href={'/dashboard'}>
					<Button variant='danger'>Back</Button>
				</Link>
			</div>
			<h1 className='flex text-4xl font-bold text-gray-800'>
				{user.displayName} <span className='text-lg my-auto text-gray-500 ml-4'>{user.uid}</span>
			</h1>

			<div className='flex space-x-4'>
				<Button variant='danger' onClick={signOut}>
					Sign Out
				</Button>
			</div>
		</div>
	);
}
