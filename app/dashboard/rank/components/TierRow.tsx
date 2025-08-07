/**
 * TierRow component displays a single row in a tier list, containing items
 * grouped by the user.
 *
 * Features:
 * - Displays tier name with custom background color
 * - Supports drag and drop functionality for items
 * - Shows user column headers for the first tier
 * - Renders items grouped by user in a flex layout
 */

'use client';

import React from 'react';
import { TierListItemModel } from '../../../model/TierListItem';
import { Tier } from '../../../model/Tier';
import ColumnHeader from '@/app/components/ColumnHeader';
import RenderedItem from './RenderedItem';
import { useDroppable } from '@dnd-kit/core';
import { TIER_ROW_BG_COLOR_HOVER } from '@/app/constants';

interface TierRowProps {
	tier: Tier;
	// Index of the tier
	index: number;
	// Map of user name to items
	items: Map<string, TierListItemModel[]>;
	// The size of rendered items
	itemSize: number;
}

const TierRow: React.FC<TierRowProps> = ({ tier, index, items, itemSize }) => {
	const { isOver, setNodeRef } = useDroppable({
		id: tier.id,
	});

	const coloredSquareStyle = {
		backgroundColor: tier.color,
	};

	return (
		<div
			ref={setNodeRef}
			id={tier.id}
			className={`flex grow-1 sm:flex-row items-center border-x-4 border-y-2 border-black`}
		>
			<div
				style={coloredSquareStyle}
				className='min-h-30 h-full min-w-30 w-fit flex items-center justify-center'
			>
				{tier.name}
			</div>
			<div className='flex flex-1 h-full min-h-30'>
				{Array.from(items.entries()).map(([userName, items], i) => (
					<div
						key={i}
						className='flex-1 flex flex-wrap gap-2 p-1 border-l-4 border-black'
						style={i == 0 && isOver ? { backgroundColor: TIER_ROW_BG_COLOR_HOVER } : undefined}
					>
						{index === 0 && i > 0 && (
							<div className='absolute flex justify-center items-center -top-9 -left-0 -right-0 w-full p-0'>
								<ColumnHeader text={userName} />
							</div>
						)}
						{items.map((item) => (
							<RenderedItem key={item.id} item={item} itemSize={itemSize} isDraggable={true} />
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export { TierRow };
