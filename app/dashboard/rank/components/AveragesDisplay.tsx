import ColumnHeader from '@/app/components/ColumnHeader';
import { TierList, TierListUserRankings } from '@/app/model/TierList';
import { TierListItem, TierListItemModel } from '@/app/model/TierListItem';
import DraggableItem from './DraggableItem';
import { AVERAGES_TIER_ITEM_HEIGHT, TIER_ROW_HEIGHT } from '@/app/constants';

class ItemStatus {
	item: TierListItem;
	count: number;
	sum: number;
	average: number;
	constructor(item: TierListItemModel, count: number, sum: number) {
		// Username not needed here
		this.item = new TierListItem(item.id, item.type, item.value, '', false);
		this.count = count;
		this.sum = sum;

		// Will be set later
		this.average = 0;
	}
}

type AverageItemMapping = [number, Array<ItemStatus>];

const renderSingleItemStatus = (status: ItemStatus) => {
	return (
		<div key={status.item.id} className='w-fit'>
			<DraggableItem item={status.item} />
		</div>
	);
};

const renderMultipleItemStatuses = (statuses: ItemStatus[]) => {
	const items = [];
	for (let i = 0; i < statuses.length; i += 2) {
		if (i + 1 === statuses.length) {
			const status = statuses[i];
			items.push(
				<div key={i} className='w-fit'>
					<DraggableItem item={status.item} />
				</div>
			);
		} else {
			const status1 = statuses[i];
			const status2 = statuses[i + 1];
			items.push(
				<div key={i} className='flex flex-row space-x-2'>
					<div className='w-fit'>
						<DraggableItem item={status1.item} />
					</div>
					<div className='w-fit'>
						<DraggableItem item={status2.item} />
					</div>
				</div>
			);
		}
	}
	return (
		<div
			key={statuses[0].item.id}
			className='flex flex-col border border-indigo-600 px-2 justify-center items-center'
		>
			{items}
		</div>
	);
};

interface AveragesDisplayProps {
	tierList: TierList;
	// Maps user ID to their tier list rankings
	allRankings: TierListUserRankings;
	// TODO: Delete this
	tempId: string;
}

export const AveragesDisplay: React.FC<AveragesDisplayProps> = ({
	tierList,
	allRankings,
	tempId,
}) => {
	// Maps item ID to the item "value"
	const averages = new Map<string, ItemStatus>();
	const tiers = tierList.tiers;

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

	if (tempId === 'TEST1') {
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
	}

	items.forEach((item) => (item.average = Math.round((item.sum / item.count) * 100) / 100));
	items.sort((a, b) => a.average - b.average);

	const colors = tiers.map((tier) => tier.color);

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
			// if (previousItem.average === item.average) {
			// 	const lastItem: AverageItemMapping = itemMappings[itemMappings.length - 1];
			// 	lastItem[1].push(item);
			// 	if (lastItem[1].length % 2 === 1) {
			// 		// Only add if we have odd number of items (will go to next line)
			// 		gradientRowsIndex += 1;
			// 	}
			// } else {
			itemMappings.push([item.average, [item]]);
			gradientRowsIndex += 1;
			// }
		}
		previousItem = item;
		// While loop to possibly skip indices that are not rated at all
		while (item.average >= previousIndex) {
			tierMarkersIndices.push(gradientRowsIndex);
			previousIndex += 1;
		}
	}

	// const tierColorPercentages: number[] = [];
	const tierColorPercentages: number[] = [0, 16, 33, 50, 67, 83];

	// for (let i = 0; i < colors.length; i++) {
	// 	const index = tierMarkersIndices[i];
	// 	let percentage = Math.round((100 * (index - 1)) / gradientRowsIndex);
	// 	while (tierColorPercentages.includes(percentage)) {
	// 		percentage += 1;
	// 	}
	// 	tierColorPercentages.push(percentage);
	// }
	console.log(tierColorPercentages);

	const renderItemPoint = (itemMapping: [number, ItemStatus]) => {
		const rowHeight = `calc(var(--spacing) * ${TIER_ROW_HEIGHT}`;
		const topPx = rowHeight + ' * ' + itemMapping[0];
		return (
			<div
				className='absolute w-2 h-2 rounded-full border-2 border-black bg-black'
				style={{ top: topPx + 'px' }}
			></div>
		);
	};

	// Height of the average display (0- max # of tiers)
	const totalHeight = tiers.length;
	const itemRenderArray = [];
	for (const itemMapping of itemMappings) {
		console.log(itemMapping);
		const status = itemMapping[1][0];
		itemRenderArray.push(renderItemPoint(itemMapping));
		// if (itemMapping[1].length === 1) {
		// 	// solo item
		// 	const status = itemMapping[1][0];
		// 	itemRenderArray.push(renderSingleItemStatus(status));
		// } else {
		// 	itemRenderArray.push(renderMultipleItemStatuses(itemMapping[1]));
		// }
	}

	const tierColorGradients = tierColorPercentages.map(
		(percentage, i) => colors[i] + ' ' + percentage + '%'
	);
	const gradientBarStyle = {
		background: `local linear-gradient(to bottom, ${tierColorGradients.join(', ')})`,
	};
	console.log(itemRenderArray);

	return (
		<div className='flex relative flex-col flex-1 justify-center items-center border-t-4 border-black'>
			<div className='absolute flex -top-9'>
				<ColumnHeader text='Average' />
			</div>
			<div className='flex h-full w-full overflow-hidden overflow-y-scroll'>
				<div
					className='relative flex flex-col min-h-full h-fit w-full overflow-y-hidden bg-local items-center'
					style={gradientBarStyle}
				>
					{itemRenderArray}
					{tierColorPercentages.map((percentage: number, i: number) => (
						<div
							className='absolute flex w-full left-0 group'
							key={i}
							style={{
								paddingBottom: 'calc(var(--spacing) * ' + TIER_ROW_HEIGHT / 2 + ')',
								paddingTop: 'calc(var(--spacing) * ' + TIER_ROW_HEIGHT / 2 + ')',
								top: 'calc(' + percentage + '%)',
							}}
						>
							<div className='relative w-2 h-px border border-gray-500'>
								<div className='invisible group-hover:visible font-bold select-none absolute left-1 bottom-0 opacity-100 rounded whitespace-nowrap'>
									{tiers[i].name}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
