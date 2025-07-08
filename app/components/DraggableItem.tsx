'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TierListItem, TierListItemModel } from '../model/TierListItem';
import { getInitials } from '../utils';

interface DraggableItemProps {
	item: TierListItemModel;
	isOverlay?: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, isOverlay = false }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
		data: { item: item },
	});

	// TierListItem means this is a different user's ranking, so not draggable.
	if (item instanceof TierListItem) {
		const initials = getInitials(item.userName);
		return (
			<div className='relative'>
				<span className='w-14 mb-2 aspect-square flex items-center justify-center bg-white/50'>
					{item.value}
				</span>
				<div className='flex absolute -top-2 -left-2 bg-red-500 w-6 h-6 rounded-full items-center group'>
					<span className='text-white font-bold select-none'>{initials}</span>
					<div className='absolute font-bold -top-6 left-0 bg-black/25 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
						{item.userName}
					</div>
				</div>
			</div>
		);
	}

	const style = {
		transform: CSS.Transform.toString(transform),
		opacity: isDragging && !isOverlay ? 0 : 1,
		cursor: isDragging ? 'grabbing' : 'grab',
		touchAction: 'none', // Important for touch devices
	};

	return (
		<div
			ref={setNodeRef} // Attach the ref for DND-Kit
			style={style}
			{...listeners} // Attach event listeners for dragging
			{...attributes} // Attach accessibility attributes
			className={`
        draggable-tier-item
        w-14 mb-2 aspect-square flex items-center justify-center bg-white
        ${isOverlay ? 'z-50 border-2 border-blue-500' : ''}
      `}
		>
			<span className='text-sm font-medium'>{item.value}</span>
		</div>
	);
};

export default DraggableItem;
