export const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
	const baseStyle =
		'px-6 py-3 rounded-full font-semibold transition duration-300 ease-in-out transform hover:scale-105 shadow-md';
	const variants = {
		primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
		secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
		danger: 'bg-red-500 text-white hover:bg-red-600',
		outline: 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
	};
	return (
		<button
			onClick={onClick}
			className={`${baseStyle} ${variants[variant]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};
