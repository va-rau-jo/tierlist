export class TierListItem {
	id: string;
	type: 'text' | 'image';
	value: string;

	constructor(id: string, type: 'text' | 'image' = 'text', value: string = '') {
		this.id = id;
		this.type = type;
		this.value = value;
	}
}
