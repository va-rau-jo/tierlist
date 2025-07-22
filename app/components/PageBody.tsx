import { ReactNode } from 'react';

export const PageBody = ({ children, className }: { children: ReactNode; className?: string }) => {
	return (
		<div
			className={`min-h-screen overflow-clip bg-gradient-to-b from-orange-100 to-blue-200 ${
				className || ''
			}`}
		>
			{children}
		</div>
	);
};
