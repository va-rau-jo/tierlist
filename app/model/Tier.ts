export class Tier {
	id: string;
	name: string;
	color: string;

	constructor(id: string, name: string, color: string) {
		this.id = id;
		this.name = name;
		this.color = color;
	}
}

export const UNASSIGNED_TIER = 'unassigned';
