import React from 'react';

enum ButtonVariant {
	primary = 'primary',
	secondary = 'secondary',
	danger = 'danger',
	outline = 'outline',
}

const getVariantFromText = (text: string): ButtonVariant => {
	switch (text) {
		case 'primary':
			return ButtonVariant.primary;
		case 'secondary':
			return ButtonVariant.secondary;
		case 'danger':
			return ButtonVariant.danger;
		case 'outline':
			return ButtonVariant.outline;
		default:
			return ButtonVariant.primary;
	}
};

export interface ButtonProps {
	children: React.ReactNode;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	variant?: ButtonVariant | string;
	disabled?: boolean;
	className?: string;
}

export const Button = ({
	children,
	onClick,
	variant = 'primary',
	disabled = false,
	className = '',
	...props
}: ButtonProps) => {
	let baseStyle =
		'inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-sm';

	const variants: Record<ButtonVariant, string> = {
		[ButtonVariant.primary]: 'bg-indigo-600 text-white hover:bg-indigo-700',
		[ButtonVariant.secondary]: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
		[ButtonVariant.danger]: 'bg-red-500 text-white hover:bg-red-600',
		[ButtonVariant.outline]: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
	};
	const variantEnum = getVariantFromText(variant);
	return (
		<button
			onClick={onClick}
			className={`${baseStyle} ${variants[variantEnum]} ${className}`}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
};

export const ActionButton = ({
	children,
	onClick,
	variant = 'primary',
	className = '',
	...props
}: ButtonProps) => {
	const baseStyle =
		'inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
	const variants: Record<ButtonVariant, string> = {
		[ButtonVariant.primary]: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
		[ButtonVariant.secondary]: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
		[ButtonVariant.danger]: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
		[ButtonVariant.outline]:
			'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400',
	};
	const variantEnum = getVariantFromText(variant);
	return (
		<button
			onClick={onClick}
			className={`${baseStyle} ${variants[variantEnum]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};
