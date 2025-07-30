import { ReactNode } from 'react';

export const Page = ({ children, className }: { children: ReactNode; className?: string }) => {
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

export const PageBody = ({ children, className }: { children: ReactNode; className?: string }) => {
	return (
		<div className={`bg-white px-8 pt-2 rounded-lg shadow-xl max-w-5xl mx-auto ${className || ''}`}>
			{children}
		</div>
	);
};
