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
import { ReactNode, useState } from 'react';
import Image from 'next/image';
import CloseIcon from '../../../components/CloseIcon';
import { ImageLoadStatus, useImageLoader } from '@/app/components/providers/ImageLoaderProvider';

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
	// The size of the average markers
	itemSize: number;
}

export const AveragesDisplay: React.FC<AveragesDisplayProps> = ({
	tierList,
	allRankings,
	itemSize,
}) => {
	const { getImageStatus } = useImageLoader();

	// Tuple with [tierIndex, indexWithinTier] that identifies the item to display.
	const [displayedItemIndex, setDisplayedItemIndex] = useState<number[]>([]);

	const toggleDisplayedItemIndex = (index: number[]) => {
		const sameIndex = displayedItemIndex[0] === index[0] && displayedItemIndex[1] === index[1];
		setDisplayedItemIndex(sameIndex ? [] : index);
	};

	const getImageDiv = (status: ItemStatus): ReactNode => {
		if (!status.item.imageUrl) {
			return null;
		}

		const imageStatus = getImageStatus(status.item.imageUrl);
		if (imageStatus === ImageLoadStatus.LOADED) {
			return (
				<Image
					src={status.item.imageUrl}
					height='100'
					width='100'
					alt='Tier list item'
					className='object-cover'
				/>
			);
		} else if (imageStatus === ImageLoadStatus.LOADING) {
			return (
				<Image
					src='/loading_black.gif'
					height='100'
					width='100'
					alt='Loading...'
					className='object-cover'
				/>
			);
		}
		return null;
	};

	// The size of an average marker circle.
	const markerSize = itemSize / 0.75;
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

	// Create map of item id to the item status.
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
	const items = Array.from(averages.values());
	// Add item average field based on sum and count, and sort based on average.
	items.forEach((item) => (item.average = Math.round((item.sum / item.count) * 100) / 100));
	items.sort((a, b) => a.average - b.average);

	// Map items to their ranking number, dupes are concatenated into 1 array.
	const itemMappings: AverageItemMapping[] = [];
	// Stores the indices of the tier markers (relative to total number of rows)
	let previousItem: ItemStatus | undefined;
	for (let i = 0; i < items.length; i += 1) {
		const item = items[i];
		if (previousItem && previousItem.average === item.average) {
			const lastItem: AverageItemMapping = itemMappings[itemMappings.length - 1];
			lastItem[1].push(item);
		} else {
			itemMappings.push([item.average, [item]]);
		}
		previousItem = item;
	}

	const createItemPopup = (status: ItemStatus) => {
		// Get the range of the average, (e.g. S-A Tier or B Tier).
		const lowTier = tiers[Math.ceil(status.average)].name;
		const highTier = tiers[Math.floor(status.average)].name;
		const tierText = lowTier === highTier ? `${lowTier} Tier` : `${highTier}-${lowTier} Tier`;
		// Set tier color to the higher tier.
		const tierColor = colors[Math.floor(status.average)];

		return (
			<div
				className='absolute left-1/2 flex flex-col w-max transform -translate-x-1/2 bg-white border border-gray-300 rounded text-sm shadow-lg cursor-default'
				style={{ bottom: `calc(${markerSize}px + 10px)` }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex space-x-2'>
					{getImageDiv(status)}
					<div className='flex flex-col min-w-fit justify-center'>
						<div className='flex justify-end'>
							<button
								className='w-5 h-5 flex justify-center items-center hover:rounded-full hover:bg-gray-200 transition-all cursor-pointer select-none'
								onClick={() => toggleDisplayedItemIndex([])}
							>
								<CloseIcon />
							</button>
						</div>
						<div className='flex flex-col justify-center items-center mb-4 px-2 flex-1'>
							<span className='text-lg'>{status.item.name}</span>
							<span
								className='rounded text-center font-bold px-6 select-none'
								style={{ backgroundColor: tierColor }}
							>
								{tierText}
							</span>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderItemPoints = (itemMapping: [number, ItemStatus[]]) => {
		const tierIndex = itemMapping[0];
		// Round to the nearest 2 decimals.
		const percentage = Math.round((10000 * tierIndex) / tiers.length) / 100;
		// Center the points in the middle of the row
		const offset = TIER_ROW_HEIGHT * 0.5 - 1;
		const topPx = `calc(${percentage}% + var(--spacing) * ${offset})`;

		return (
			<div
				key={tierIndex}
				className='absolute flex flex-wrap justify-center space-x-1 space-y-1 ml-4 mr-2'
				style={{ top: topPx }}
			>
				{itemMapping[1].map((status, i) => {
					// Circle marker in average gradient
					const imageDiv = getImageDiv(status);
					if (imageDiv) {
						return (
							<div className='relative' key={i}>
								<Image
									src={status.item.imageUrl}
									alt='Tier list item'
									width='100'
									height='100'
									className='relative rounded-full border-2 border-black cursor-pointer z-100'
									style={{
										width: markerSize + 'px',
										height: markerSize + 'px',
									}}
									onClick={() => toggleDisplayedItemIndex([tierIndex, i])}
								/>
								{tierIndex === displayedItemIndex[0] && i === displayedItemIndex[1]
									? createItemPopup(status)
									: null}
							</div>
						);
					}
					return (
						<div
							key={i}
							className='relative rounded-full border-2 border-black bg-black cursor-pointer z-100'
							style={{ width: markerSize + 'px', height: markerSize + 'px' }}
							onClick={() => toggleDisplayedItemIndex([tierIndex, i])}
						>
							{tierIndex === displayedItemIndex[0] && i === displayedItemIndex[1]
								? createItemPopup(status)
								: null}
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div className='flex relative flex-col flex-1 justify-center items-center border-y-2 border-r-4 border-black'>
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
							{/* Tier markers on the side of the average display. */}
							<div className='relative w-2 h-px border border-gray-500'></div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
