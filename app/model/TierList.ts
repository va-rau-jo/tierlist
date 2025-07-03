/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tier } from './Tier';
import { TierListItem } from './TierListItem';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp from Firestore

export type TierListRanking = Map<Tier, TierListItem[]>;
export type TierListRankings = Map<string, TierListRanking>;

export class TierList {
	// Id of the tier list
	id: string;
	// User id of the creator
	creatorId: string;
	// Name of the creator.
	creatorName: string;
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
	items: TierListItem[];
	// Map of user id to ranking map. Ranking map maps Tier to list of tier
	// list items.
	rankings: TierListRankings;

	constructor(
		creatorId: string,
		creatorName: string,
		createdAt: Timestamp,
		lastUpdatedAt: Timestamp,
		listName: string,
		listDescription: string,
		tiers: Tier[],
		items: TierListItem[],
		rankings: TierListRankings
	) {
		this.id = '';
		this.creatorId = creatorId;
		this.creatorName = creatorName;
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
			id: this.id,
			creatorId: this.creatorId,
			creatorName: this.creatorName,
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

	static fromFirebase(obj: any): TierList {
		if (!obj) {
			throw new Error('Invalid tier list object');
		}
		console.log('FROM FIREBASE');
		console.log(obj);
		const tiers = obj.tiers.map((t: any) => new Tier(t.id, t.name, t.color));
		const items = obj.items.map((i: any) => new TierListItem(i.id, i.type, i.value));
		const rankings = new Map<string, TierListRanking>();

		obj.rankings.forEach((ranking: any) => {
			const userRanking: TierListRanking = new Map<Tier, TierListItem[]>();
			ranking.rankings.forEach((r: any) => {
				const tier = tiers.find((t) => t.id === r.tier.id);
				const rankedItems = r.items
					.map((itemId: string) => items.find((item: any) => item.id === itemId))
					.filter((item: TierListItem | undefined): item is TierListItem => item !== undefined);
				if (tier) {
					userRanking.set(tier, rankedItems);
				}
			});
			rankings.set(ranking.userId, userRanking);
		});

		const tierlist = new TierList(
			obj.creatorId,
			obj.creatorName,
			obj.createdAt,
			obj.lastUpdatedAt,
			obj.name,
			obj.description,
			tiers,
			items,
			rankings
		);
		tierlist.id = obj.id;
		return tierlist;
	}
}
