/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tier, UNASSIGNED_TIER } from './Tier';
import { TierListItemModel } from './TierListItem';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp from Firestore

// Maps a tier id to the items in that tier (a ranking)
export type TierListRankings = Map<string, TierListItemModel[]>;
// Maps a user ID to their tier list rankings
export type TierListUserRankings = Map<string, TierListRankings>;

export class TierList {
	// Id of the tier list
	id: string;
	// User id of the creator
	creatorId: string;
	// Name of the creator.
	creatorName: string;
	// Ids of allowed editors
	editorIds: Set<string>;
	// Created timestamp
	createdAt: Timestamp;
	// Updated timestamp
	lastUpdatedAt: Timestamp;
	// Name / title of the tier list
	name: string;
	// Description of the tier list
	description: string;
	// Tiers (S, A, etc)
	tiers: Tier[];
	// Tier list items that can be ranked
	items: TierListItemModel[];
	// Map of user id to ranking map. Ranking map maps Tier to list of tier
	// list items.
	userRankings: TierListUserRankings;

	constructor(
		creatorId: string,
		creatorName: string,
		editorIds: Set<string>,
		createdAt: Timestamp,
		lastUpdatedAt: Timestamp,
		listName: string,
		listDescription: string,
		tiers: Tier[],
		items: TierListItemModel[],
		userRankings: TierListUserRankings
	) {
		this.id = '';
		this.creatorId = creatorId;
		this.creatorName = creatorName;
		this.editorIds = editorIds;
		this.createdAt = createdAt;
		this.lastUpdatedAt = lastUpdatedAt;
		this.name = listName;
		this.description = listDescription;
		this.tiers = tiers;
		this.items = items;
		this.userRankings = userRankings;
	}

	toFirebaseObject() {
		return {
			id: this.id,
			creatorId: this.creatorId,
			creatorName: this.creatorName,
			editorIds: Array.from(this.editorIds),
			createdAt: this.createdAt,
			lastUpdatedAt: this.lastUpdatedAt,
			name: this.name,
			description: this.description,
			tiers: this.tiers.map((tier: Tier) => ({
				id: tier.id,
				name: tier.name,
				color: tier.color,
			})),
			items: this.items.map((item: TierListItemModel) => ({
				id: item.id,
				type: item.type,
				value: item.value,
			})),
			userRankings: Array.from(this.userRankings.entries()).map(([userId, rankings]) => ({
				userId,
				rankings: Array.from(rankings.entries()).map(([tier, items]) => ({
					tier,
					items: items.map((item) => item.id),
				})),
			})),
		};
	}

	static fromFirebase(obj: any): TierList {
		if (!obj) {
			throw new Error('Invalid tier list object');
		}
		const tiers = obj.tiers.map((t: any) => new Tier(t.id, t.name, t.color));
		const items = obj.items.map((i: any) => new TierListItemModel(i.id, i.type, i.value));

		const userRankings = new Map<string, TierListRankings>();
		// Convert obj.rankings to a map of TierListUserRankings
		// Firebase only stores objects, so iterate over the object keys / values
		if (obj.rankings && Object.keys(obj.rankings).length > 0) {
			// Key: user ID, Value: array of TierListRankings
			Object.entries(obj.rankings).forEach(([userId, userRanking]: [string, any]) => {
				const rankings = new Map<string, TierListItemModel[]>();
				// Key: Tier list ID, Value: TierListItem ID
				// Add all ranked items (does not include unassigned items)
				const rankedItemIds = new Set<string>();
				Object.entries(userRanking).forEach(([tierId, itemIds]: [string, any]) => {
					const tierItems = itemIds.map((itemId: string) => {
						rankedItemIds.add(itemId);
						return items.find((item: TierListItemModel) => item.id === itemId);
					});
					rankings.set(tierId, tierItems);
				});
				// Add unassigned items to the unassigned tier
				rankings.set(
					UNASSIGNED_TIER,
					items.filter((item: TierListItemModel) => !rankedItemIds.has(item.id))
				);

				userRankings.set(userId, rankings);
			});
		}

		const tierlist = new TierList(
			obj.creatorId,
			obj.creatorName,
			new Set(obj.editorIds),
			obj.createdAt,
			obj.lastUpdatedAt,
			obj.name,
			obj.description,
			tiers,
			items,
			userRankings
		);
		tierlist.id = obj.id;
		return tierlist;
	}
}
