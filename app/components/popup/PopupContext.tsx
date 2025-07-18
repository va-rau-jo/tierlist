'use client';

import { DEFAULT_POPUP_DISPLAY_TIME_MS } from '@/app/constants';
import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';

type PopupType = 'error' | 'success' | 'info';

interface PopupState {
	message: string | null;
	type: PopupType;
	opacity: number;
}

interface PopupContextType {
	popup: PopupState;
	showPopup: (message: string, type: PopupType, duration?: number) => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
	const [popup, setPopup] = useState<PopupState>({
		message: null,
		type: 'error',
		opacity: 0,
	});

	// Use a ref to store the timeout ID so it persists across renders
	// and can be cleared if a new popup is shown before the old one hides.
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const hidePopup = useCallback(() => {
		setPopup((prev) => ({ ...prev, opacity: 0 }));
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const showPopup = useCallback(
		(message: string, type: PopupType, duration: number = DEFAULT_POPUP_DISPLAY_TIME_MS) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Set popup to visible and set timeout to make it invisible.
			setPopup({ message, type, opacity: 1 });
			timeoutRef.current = setTimeout(hidePopup, duration);
		},
		[hidePopup]
	);

	return (
		<PopupContext.Provider
			value={{
				popup,
				showPopup,
			}}
		>
			{children}
		</PopupContext.Provider>
	);
};

export const usePopup = () => {
	const context = useContext(PopupContext);
	if (context === undefined) {
		throw new Error('usePopup must be used within a PopupProvider');
	}
	return context;
};
