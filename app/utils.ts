export const generateUniqueId = () => {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const getInitials = (name: string) => {
	return name
		.split(' ')
		.map((n) => n[0])
		.join('');
};
