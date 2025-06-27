import React from 'react';

interface TextareaProps {
	label?: string;
	id: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	className?: string;
	[key: string]: any;
}

export const Textarea: React.FC<TextareaProps> = ({
	label,
	id,
	value,
	onChange,
	placeholder,
	className = '',
	...props
}) => (
	<div className='mb-4'>
		{label && (
			<label htmlFor={id} className='block text-sm font-medium text-gray-700 mb-1'>
				{label}
			</label>
		)}
		<textarea
			id={id}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			rows={3}
			className={`mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
			{...props}
		></textarea>
	</div>
);
