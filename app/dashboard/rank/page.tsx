'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Just redirect to dashboard if there is no ID.
const RankRedirect = () => {
	const router = useRouter();

	useEffect(() => {
		router.push('/dashboard');
	}, [router]);
};

export default RankRedirect;
