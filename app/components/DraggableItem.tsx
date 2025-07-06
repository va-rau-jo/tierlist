'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TierListItem } from '../model/TierListItem';

interface DraggableItemProps {
	item: TierListItem; // The actual item data
	isOverlay?: boolean; // New prop for overlay specific styling
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, isOverlay = false }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
		data: { item: item },
	});

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
			// bg-gray-100 dark:bg-gray-700 p-2 rounded shadow text-center
		>
			<span className='text-sm font-medium'>{item.value}</span>
		</div>
	);
};

export default DraggableItem;
