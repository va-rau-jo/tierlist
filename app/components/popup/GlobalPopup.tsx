'use client';

import React from 'react';
import { usePopup } from './PopupContext';

const GlobalPopup = () => {
	const { popup } = usePopup();

	const bgColors = {
		success: 'bg-green-700',
		info: 'bg-blue-500',
		error: 'bg-rose-600',
	};

	return (
		<div
			className={`fixed bottom-8 left-0 right-0 p-3 w-fit mx-auto rounded-lg text-white text-lg ${
				bgColors[popup.type]
			} transition-opacity duration-500`}
			style={{ opacity: popup.opacity }}
		>
			{popup.message}
		</div>
	);
};

export default GlobalPopup;
