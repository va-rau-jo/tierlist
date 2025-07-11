const ColumnHeader = ({ text }: { text: string }) => {
	return (
		<span className='bg-blue-500 font-bold tracking-wide px-4 text-white rounded-full select-none'>
			{text}
		</span>
	);
};

export default ColumnHeader;
