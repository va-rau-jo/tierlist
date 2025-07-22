/**
 * A React component that displays the average rankings of items in a tier list
 * using a gradient bar visualization.
 *
 * The component shows:
 * - A vertical gradient bar representing different tiers
 * - Points plotted along the gradient showing where items fall on average
 * - Clickable points that reveal item details (name and average ranking)
 * - Tier markers showing boundaries between tiers
 */

import ColumnHeader from '@/app/components/ColumnHeader';
import { TierList, TierListUserRankings } from '@/app/model/TierList';
import { TierListItem, TierListItemModel } from '@/app/model/TierListItem';
import { TIER_ROW_HEIGHT } from '@/app/constants';
import { useState } from 'react';

class ItemStatus {
	item: TierListItem;
	count: number;
	sum: number;
	average: number;
	constructor(item: TierListItemModel, count: number, sum: number) {
		// Username not needed here
		this.item = new TierListItem(item.id, item.name, item.imageUrl, '', false);
		this.count = count;
		this.sum = sum;
		// Will be set later
		this.average = 0;
	}
}

type AverageItemMapping = [number, Array<ItemStatus>];

interface AveragesDisplayProps {
	tierList: TierList;
	// Maps user ID to their tier list rankings
	allRankings: TierListUserRankings;
}

export const AveragesDisplay: React.FC<AveragesDisplayProps> = ({ tierList, allRankings }) => {
	// Tuple with [tierIndex, indexWithinTier] that identifies the item to display.
	const [displayedItemIndex, setDisplayedItemIndex] = useState<number[]>([]);

	const toggleDisplayedItemIndex = (index: number[]) => {
		const sameIndex = displayedItemIndex[0] === index[0] && displayedItemIndex[1] === index[1];
		setDisplayedItemIndex(sameIndex ? [] : index);
	};

	// Maps item ID to the item "value"
	const averages = new Map<string, ItemStatus>();
	const tiers = tierList.tiers;
	const colors = tiers.map((tier) => tier.color);
	// The percentage where each tier should start (0-100%)
	const tierColorPercentages = tiers.map((_, i) => (i / tiers.length) * 100);
	// The tier colors and their percentages.
	const gradientBarStyle = {
		background: `local linear-gradient(to bottom, ${tierColorPercentages
			.map((percentage, i) => `${colors[i]} ${percentage}%`)
			.join(', ')})`,
	};

	// Create list of average items
	for (const [, rankings] of allRankings.entries()) {
		for (const [tierId, items] of rankings.entries()) {
			for (const item of items) {
				const tier = tiers.find((t) => t.id === tierId);
				if (!tier) {
					continue; // Item is in the unassigned tier
				}
				const tierIndex = tiers.indexOf(tier!);

				if (averages.has(item.id)) {
					averages.get(item.id)!.count++;
					averages.get(item.id)!.sum += tierIndex;
				} else {
					averages.set(item.id, new ItemStatus(item, 1, tierIndex));
				}
			}
		}
	}
	let items = Array.from(averages.values());

	items = [
		new ItemStatus(new TierListItemModel('0', 'text', '0'), 1, 0),
		new ItemStatus(new TierListItemModel('0', 'text', '0'), 1, 0),
		new ItemStatus(new TierListItemModel('0', 'text', '0'), 1, 0),
		new ItemStatus(new TierListItemModel('0.33', 'text', '0.33'), 1, 0.33),
		new ItemStatus(new TierListItemModel('0.33', 'text', '0.33'), 1, 0.33),
		new ItemStatus(new TierListItemModel('1', 'text', '1'), 1, 1),
		new ItemStatus(new TierListItemModel('5', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (3)', 'text', '5 (3)'), 1, 5),
		new ItemStatus(new TierListItemModel('5', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (3)', 'text', '5 (3)'), 1, 5),
		new ItemStatus(new TierListItemModel('5', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('1', 'text', '1'), 1, 1),
		new ItemStatus(new TierListItemModel('5', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (3)', 'text', '5 (3)'), 1, 5),
		new ItemStatus(new TierListItemModel('5', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (3)', 'text', '5 (3)'), 1, 5),
		new ItemStatus(new TierListItemModel('5', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (3)', 'text', '5 (3)'), 1, 5),
		new ItemStatus(new TierListItemModel('1.5', 'text', '1.5'), 2, 3),
		new ItemStatus(new TierListItemModel('2', 'text', '2'), 1, 2),
		new ItemStatus(new TierListItemModel('3', 'text', '3'), 1, 3),
		new ItemStatus(new TierListItemModel('4', 'text', '4'), 1, 4),
		new ItemStatus(new TierListItemModel('4.5', 'text', '4.5'), 1, 4.5),
		new ItemStatus(new TierListItemModel('5 (2)', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (4)', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (5)', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (2)', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (4)', 'text', '5'), 1, 5),
		new ItemStatus(new TierListItemModel('5 (5)', 'text', '5'), 1, 5),
	];

	items.forEach((item) => (item.average = Math.round((item.sum / item.count) * 100) / 100));
	items.sort((a, b) => a.average - b.average);

	// Map items to their ranking number, dupes are concatenated into 1 array.
	const itemMappings: AverageItemMapping[] = [];
	// Stores the indices of the tier markers (relative to total number of rows)
	const tierMarkersIndices = [];
	let previousItem: ItemStatus | undefined;
	// Tracks the tier index we are on.
	let previousIndex: number = 0;
	// Tracks the number of rows in the gradient
	let gradientRowsIndex = 0;
	for (let i = 0; i < items.length; i += 1) {
		const item = items[i];
		if (!previousItem) {
			itemMappings.push([item.average, [item]]);
			gradientRowsIndex += 1;
		} else {
			if (previousItem.average === item.average) {
				const lastItem: AverageItemMapping = itemMappings[itemMappings.length - 1];
				lastItem[1].push(item);
				if (lastItem[1].length % 2 === 1) {
					// Only add if we have odd number of items (will go to next line)
					gradientRowsIndex += 1;
				}
			} else {
				itemMappings.push([item.average, [item]]);
				gradientRowsIndex += 1;
			}
		}
		previousItem = item;
		// While loop to possibly skip indices that are not rated at all
		while (item.average >= previousIndex) {
			tierMarkersIndices.push(gradientRowsIndex);
			previousIndex += 1;
		}
	}

	const renderItemPoints = (itemMapping: [number, ItemStatus[]]) => {
		const tierIndex = itemMapping[0];
		// Round to the nearest 2 decimals.
		const percentage = Math.round((10000 * tierIndex) / tiers.length) / 100;
		// Center the points in the middle of the row
		const offset = TIER_ROW_HEIGHT / 2 - 1;
		const topPx = `calc(${percentage}% + var(--spacing) * ${offset})`;
		return (
			<div
				key={tierIndex}
				className='absolute flex flex-wrap justify-center space-x-1 space-y-1 ml-2'
				style={{ top: topPx }}
			>
				{itemMapping[1].map((status, i) => (
					<div
						key={i}
						className='relative w-2 h-2 rounded-full border-2 border-black bg-black cursor-pointer z-100'
						onClick={() => toggleDisplayedItemIndex([tierIndex, i])}
					>
						{tierIndex === displayedItemIndex[0] && i === displayedItemIndex[1] && (
							<div
								className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded px-2 py-1 no-wrap text-sm shadow-lg cursor-default'
								onClick={(e) => e.stopPropagation()}
							>
								<div>{status.item.name}</div>
								<div>Average: {status.average}</div>
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	return (
		<div className='flex relative flex-col flex-1 justify-center items-center border-t-4 border-black'>
			<div className='absolute flex -top-9'>
				<ColumnHeader text='Average' />
			</div>
			<div className='flex h-full w-full'>
				<div
					className='relative flex flex-col min-h-full h-fit w-full items-center'
					style={gradientBarStyle}
				>
					{itemMappings.map(renderItemPoints)}
					{tierColorPercentages.map((percentage: number, i: number) => (
						<div
							className='absolute flex w-full left-0'
							key={i}
							style={{
								paddingBottom: 'calc(var(--spacing) * ' + TIER_ROW_HEIGHT / 2 + ')',
								paddingTop: 'calc(var(--spacing) * ' + TIER_ROW_HEIGHT / 2 + ')',
								top: 'calc(' + percentage + '%)',
							}}
						>
							<div className='relative w-2 h-px border border-gray-500'></div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
