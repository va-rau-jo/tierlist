'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_POPUP_DISPLAY_TIME_MS } from '../constants';

type PopupMessageType = 'success' | 'warning' | 'error';

interface PopupMessageProps {
	message: string;
	type?: PopupMessageType;
	duration?: number;
	onClose?: () => void;
}

const PopupMessage: React.FC<PopupMessageProps> = ({
	message,
	type = 'error',
	duration = DEFAULT_POPUP_DISPLAY_TIME_MS,
	onClose,
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [opacity, setOpacity] = useState(0);

	const bgColors = {
		success: 'bg-green-700',
		warning: 'bg-yellow-500',
		error: 'bg-rose-600',
	};

	useEffect(() => {
		// Fade in
		setIsVisible(true);
		const fadeIn = setTimeout(() => {
			setOpacity(1);
		}, 100);

		// Fade out
		const fadeOut = setTimeout(() => {
			setOpacity(0);
		}, duration - 500);

		// Hide and cleanup
		const hide = setTimeout(() => {
			setIsVisible(false);
			if (onClose) onClose();
		}, duration);

		return () => {
			clearTimeout(fadeIn);
			clearTimeout(fadeOut);
			clearTimeout(hide);
		};
	}, [duration, onClose]);

	if (!isVisible) return null;

	return (
		<div
			className={`fixed bottom-8 left-0 right-0 p-3 w-fit mx-auto rounded-lg text-white text-lg ${bgColors[type]} transition-opacity duration-500`}
			style={{ opacity }}
		>
			{message}
		</div>
	);
};

export default PopupMessage;
