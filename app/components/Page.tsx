import { ReactNode } from 'react';

export const Page = ({ children, className }: { children: ReactNode; className?: string }) => {
	return (
		<div className={`min-h-screen overflow-x-hidden bg-[var(--background)] ${className || ''}`}>
			{children}
		</div>
	);
};

export const PageBody = ({ children, className }: { children: ReactNode; className?: string }) => {
	return (
		<div
			className={`mx-auto w-full max-w-6xl rounded-xl border border-slate-200/80 bg-white px-6 py-4 shadow-sm ${
				className || ''
			}`}
		>
			{children}
		</div>
	);
};
