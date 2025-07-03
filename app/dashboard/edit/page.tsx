'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Just redirect to dashboard if there is no ID.
const EditPage: React.FC = () => {
	const router = useRouter();

	useEffect(() => {
		router.push('/dashboard');
	}, [router]);

	return null;
};

export default EditPage;
