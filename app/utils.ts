export const generateUniqueId = () => {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const getInitials = (name: string) => {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('');
};

export const truncateText = (text: string, maxLength: number) => {
	if (text.length > maxLength) {
		return text.substring(0, maxLength) + '...';
	}
	return text;
};
