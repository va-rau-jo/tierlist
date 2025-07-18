const disabledClass = 'bg-gray-200 text-gray-500';
const defaultInputClasses =
	'mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

interface InputProps {
	label?: string;
	id: string;
	type?: string;
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	// Override class names.
	className?: string;
	// Class names to be added to the default
	additionalClassNames?: string;
	disabled?: boolean;
}

export const Input = ({
	label,
	id,
	type = 'text',
	value,
	onChange,
	placeholder,
	className,
	additionalClassNames,
	disabled = false,
	...props
}: InputProps) => {
	let classesToUse = className ?? defaultInputClasses;
	if (additionalClassNames) {
		classesToUse += ' ' + additionalClassNames;
	}
	if (disabled) {
		classesToUse += ' ' + disabledClass;
	}
	return (
		<div>
			{label && (
				<label htmlFor={id} className='block text-sm font-medium text-gray-700 mb-1'>
					{label}
				</label>
			)}
			<input
				id={id}
				type={type}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				disabled={disabled}
				className={classesToUse}
				{...props}
			/>
		</div>
	);
};
