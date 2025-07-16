'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { TierListItem, TierListItemModel } from '../../../model/TierListItem';

interface DraggableItemProps {
	item: TierListItemModel;
	isOverlay?: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, isOverlay = false }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
		data: { item: item },
	});

	const baseClasses =
		'w-15 aspect-square flex items-center justify-center text-sm font-medium select-none';

	// TierListItem means this is a different user's ranking, so not draggable.
	if (item instanceof TierListItem) {
		return (
			<div className='relative'>
				<span className={`${baseClasses} bg-white/50`}>{item.value}</span>
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
		>
			<span
				className={`${baseClasses} bg-white ${isOverlay ? 'z-50 border-2 border-blue-500' : ''}`}
			>
				{item.value}
			</span>
		</div>
	);
};

export default DraggableItem;
