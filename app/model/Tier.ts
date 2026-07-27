export class Tier {
	id: string;
	name: string;
	color: string;
	textColor: string;

	constructor(id: string, name: string, color: string, textColor: string = '#000000') {
		this.id = id;
		this.name = name;
		this.color = color;
		this.textColor = textColor || '#000000';
	}

	static fromData(data: {
		id: string;
		name: string;
		color: string;
		textColor?: string;
	}): Tier {
		return new Tier(data.id, data.name, data.color, data.textColor || '#000000');
	}

	toFirebaseObject() {
		return {
			id: this.id,
			name: this.name,
			color: this.color,
			textColor: this.textColor || '#000000',
		};
	}
}

export const UNASSIGNED_TIER = 'unassigned';
