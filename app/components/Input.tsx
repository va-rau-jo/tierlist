export const Input = ({
	label,
	id,
	type = 'text',
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
		<input
			id={id}
			type={type}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			className={`mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
			{...props}
		/>
	</div>
);
