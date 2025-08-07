/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tier, UNASSIGNED_TIER } from './Tier';
import { TierListItemModel } from './TierListItem';
import { Timestamp } from 'firebase/firestore';

// Maps a tier id to the items in that tier (a ranking)
export type TierListRankings = Map<string, TierListItemModel[]>;
// Maps a user ID to their tier list rankings
export type TierListUserRankings = Map<string, TierListRankings>;

export class TierList {
	// NOTE: When adding a field that can be updated after the tierlist is
	// created, update firebase_utils.updateTierList

	// Id of the tier list
	id: string;
	// User id of the creator
	creatorId: string;
	// Name of the creator.
	creatorName: string;
	// Whether the tierlist is private
	isPrivate: boolean;
	// Ids of allowed editors
	editorIds: Set<string>;
	// Ids of allowed rankers
	rankerIds: Set<string>;
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
		isPrivate: boolean,
		editorIds: Set<string>,
		rankerIds: Set<string>,
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
		this.isPrivate = isPrivate;
		this.editorIds = editorIds;
		this.rankerIds = rankerIds;
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
			isPrivate: this.isPrivate,
			editorIds: Array.from(this.editorIds),
			rankerIds: Array.from(this.rankerIds),
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
				name: item.name,
				imageUrl: item.imageUrl,
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
		const items = obj.items.map((i: any) => new TierListItemModel(i.id, i.name, i.imageUrl));

		const userRankings = new Map<string, TierListRankings>();
		// Convert obj.userRankings to a map of TierListUserRankings
		// Firebase only stores objects, so iterate over the object keys / values
		if (obj.userRankings && Object.keys(obj.userRankings).length > 0) {
			// Key: user ID, Value: array of TierListRankings
			Object.entries(obj.userRankings).forEach(([userId, userRanking]: [string, any]) => {
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
			obj.isPrivate,
			new Set(obj.editorIds),
			new Set(obj.rankerIds),
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
