// Represents a tier list item fetched from Firebase.
export class TierListItemModel {
	id: string;
	name: string;
	imageUrl: string;

	constructor(id: string, name: string, imageUrl: string) {
		this.id = id;
		this.name = name;
		this.imageUrl = imageUrl;
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
		name: string,
		imageUrl: string,
		userName: string,
		isModifiable: boolean = true
	) {
		super(id, name, imageUrl);
		this.userName = userName;
		this.isModifiable = isModifiable;
	}
}
