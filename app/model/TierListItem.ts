// Represents a tier list item fetched from Firebase.
export class TierListItemModel {
	id: string;
	type: 'text' | 'image';
	value: string;

	constructor(id: string, type: 'text' | 'image' = 'text', value: string = '') {
		this.id = id;
		this.type = type;
		this.value = value;
	}
}

// Represents a tier list item that is displayed in the UI.
//  - Contains state fields like isModfiable (owned by other user), userName so
//    it displays their initials, etc.
export class TierListItem extends TierListItemModel {
	// The user this item belongs to (when rating)
	userName: string;
	// Is this item modifiable (is it read-only of another user)
	isModifiable: boolean;

	constructor(
		id: string,
		type: 'text' | 'image' = 'text',
		value: string = '',
		userName: string,
		isModifiable: boolean = true
	) {
		super(id, type, value);
		this.userName = userName;
		this.isModifiable = isModifiable;
	}
}
