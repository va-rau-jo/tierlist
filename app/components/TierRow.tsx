'use client'; // For App Router
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import DraggableItem from './DraggableItem'; // Import the draggable item
import { TierListItemModel } from '../model/TierListItem';
import { Tier } from '../model/Tier';
import { generateUniqueId } from '../utils';

interface TierRowProps {
	tier: Tier;
	items: TierListItemModel[]; // Array of items currently in this tier
}

const TierRow: React.FC<TierRowProps> = ({ tier, items }) => {
	const { setNodeRef } = useDroppable({
		id: tier.id,
	});

	return (
		<div
			ref={setNodeRef} // Attach the ref for DND-Kit
			className={`flex grow-1 sm:flex-row gap-3 items-center bg-[#404040]`}
		>
			<div
				style={{ backgroundColor: tier.color }}
				className='h-30 aspect-square flex items-center justify-center'
			>
				{tier.name}
			</div>
			<div className='tier-items flex-1 flex flex-wrap gap-2 p-2 min-h-[80px]'>
				{items.map((item) => (
					<DraggableItem key={generateUniqueId()} item={item} />
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
