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
	const baseStyle =
		'px-6 py-3 rounded-full font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-md cursor-pointer';
	const variants: Record<ButtonVariant, string> = {
		[ButtonVariant.primary]: 'bg-indigo-600 text-white hover:bg-indigo-700',
		[ButtonVariant.secondary]: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
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
		'px-4 py-1 rounded-full font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-md cursor-pointer';
	const variants: Record<ButtonVariant, string> = {
		[ButtonVariant.primary]: 'bg-indigo-600 text-white hover:bg-indigo-700',
		[ButtonVariant.secondary]: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
		[ButtonVariant.danger]: 'bg-red-500 text-white hover:bg-red-600',
		[ButtonVariant.outline]: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
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
