'use client'; // For App Router
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import DraggableItem from './DraggableItem'; // Import the draggable item
import { TierListItemModel } from '../../../model/TierListItem';
import { Tier } from '../../../model/Tier';
import { generateUniqueId } from '../../../utils';
import ColumnHeader from '@/app/components/ColumnHeader';

interface TierRowProps {
	tier: Tier;
	// Index of the tier
	index: number;
	// Map of user name to items
	items: Map<string, TierListItemModel[]>;
}

const TierRow: React.FC<TierRowProps> = ({ tier, index, items }) => {
	const { setNodeRef } = useDroppable({
		id: tier.id,
	});

	return (
		<div
			ref={setNodeRef} // Attach the ref for DND-Kit
			className={`flex grow-1 sm:flex-row items-center h-30 ${
				index !== 0 ? 'border-t-4 border-black' : 'border-t-4 border-black'
			}`}
		>
			<div
				style={{ backgroundColor: tier.color }}
				className='h-full aspect-square flex items-center justify-center'
			>
				{tier.name}
			</div>
			<div className='flex flex-1 h-full'>
				{Array.from(items.entries()).map(([userName, items], i) => (
					<React.Fragment key={i}>
						<div className='relative tier-items flex-1 flex flex-wrap gap-2 p-2 border-r-4'>
							{index === 0 && i > 0 && (
								<div className='absolute flex justify-center items-center -top-9 -left-0 -right-0 w-full p-0'>
									<ColumnHeader text={userName} />
								</div>
							)}
							{items.map((item) => (
								<DraggableItem key={generateUniqueId()} item={item} />
							))}
						</div>
					</React.Fragment>
				))}
			</div>
		</div>
	);
};

// You might create a generic DroppableArea for the unassigned area if you want
const DroppableArea: React.FC<{ id: string; children: React.ReactNode; className: string }> = ({
	id,
	children,
	className,
}) => {
	const { setNodeRef } = useDroppable({ id });
	return (
		<div ref={setNodeRef} className={className}>
			{children}
		</div>
	);
};

export { TierRow, DroppableArea };
