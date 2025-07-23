/**
 * A component that renders a draggable or non-draggable item in a tier list.
 * Items can display an image or a placeholder letter, with a hover tooltip
 * showing the item name.
 */
'use client';

import React from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { TierListItem, TierListItemModel } from '../../../model/TierListItem';
import Image from 'next/image';

interface RenderedItemProps {
	item: TierListItemModel;
	isDraggable?: boolean;
}

const baseClasses =
	'w-15 h-15 aspect-square flex items-center justify-center text-sm font-medium select-none';

const UndraggableItem = (item: TierListItemModel) => {
	let imageDiv = null;
	if (item.imageUrl) {
		imageDiv = (
			<Image
				src={item.imageUrl}
				height='100'
				width='100'
				alt='Tier list item'
				className={`${baseClasses} object-cover`}
			/>
		);
	} else {
		let textSize = 'text-xl';
		if (item.name.length < 5) {
			textSize = 'text-xl';
		}
		imageDiv = (
			<div className={`${baseClasses} bg-white ${textSize}`}>
				<span>{item.name}</span>
			</div>
		);
	}
	return (
		<>
			<div className='absolute flex justify-center -top-9 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-nowrap'>
				<span className='bg-gray-800/80 px-2 py-1 rounded text-white font-bold cursor-default'>
					{item.name}
				</span>
			</div>
			<div>{imageDiv}</div>
		</>
	);
};

const RenderedItem: React.FC<RenderedItemProps> = ({ item, isDraggable = true }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
	});

	// TierListItem means this is a different user's ranking, so not draggable.
	if (item instanceof TierListItem || !isDraggable) {
		return <div className='relative h-fit group'>{UndraggableItem(item)}</div>;
	}

	const style = {
		cursor: isDragging ? 'grabbing' : 'grab',
		// Hide this item if being dragged, the DndOverlay will display a copy
		opacity: isDragging ? '0' : '1',
		touchAction: 'none', // Important for touch devices
		transform: CSS.Translate.toString(transform),
	};

	return (
		<div
			className='relative h-fit group'
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
		>
			{UndraggableItem(item)}
		</div>
	);
};

export default RenderedItem;
