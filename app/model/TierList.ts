import { Tier } from './Tier';
import { TierListItem } from './TierListItem';

export type TierListRanking = Map<Tier, TierListItem[]>;
export type TierListRankings = Map<string, TierListRanking>;

export class TierList {
	// User id of the creator
	creatorId: string;
	// Created timestamp
	createdAt: any;
	// Updated timestamp
	lastUpdatedAt: any;
	// Name / title of the tier list
	name: string;
	// Description of the tier list
	description: string;
	// Tiers (S, A, etc)
	tiers: Tier[];
	// Tier list items that can be ranked
	items: TierListItem[];
	// Map of user id to ranking map. Ranking map maps Tier to list of tier
	// list items.
	rankings: TierListRankings;

	constructor(
		creatorId: string,
		createdAt: any,
		lastUpdatedAt: any,
		listName: string,
		listDescription: string,
		tiers: Tier[],
		items: TierListItem[],
		rankings: TierListRankings
	) {
		this.creatorId = creatorId;
		this.createdAt = createdAt;
		this.lastUpdatedAt = lastUpdatedAt;
		this.name = listName;
		this.description = listDescription;
		this.tiers = tiers;
		this.items = items;
		this.rankings = rankings;
	}

	toFirebaseObject() {
		return {
			creatorId: this.creatorId,
			createdAt: this.createdAt,
			lastUpdatedAt: this.lastUpdatedAt,
			name: this.name,
			description: this.description,
			tiers: this.tiers.map((tier: Tier) => ({
				id: tier.id,
				name: tier.name,
				color: tier.color,
			})),
			items: this.items.map((item: TierListItem) => ({
				id: item.id,
				type: item.type,
				value: item.value,
			})),
			rankings: Array.from(this.rankings.entries()).map(([userId, rankings]) => ({
				userId,
				rankings: Array.from(rankings.entries()).map(([tier, items]) => ({
					tier,
					items: items.map((item) => item.id),
				})),
			})),
		};
	}
}
