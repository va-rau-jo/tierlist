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
		<header className='sticky top-0 z-40 w-full border-b border-slate-800/40 bg-slate-900'>
			<div className='mx-auto flex h-12 max-w-7xl items-center justify-between px-4'>
				<div className='flex items-center gap-1'>
					<Link
						href='/dashboard'
						className='flex items-center rounded-md p-2 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white'
						aria-label='Dashboard'
					>
						<HomeIcon />
					</Link>
					<Link
						href='/profile'
						className='flex items-center rounded-md p-2 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white'
						aria-label='Account'
					>
						<UserIcon />
					</Link>
				</div>
				<span className='text-sm font-semibold tracking-wide text-white'>Tier Lists</span>
				<div className='w-16' aria-hidden />
			</div>
		</header>
	);
}
