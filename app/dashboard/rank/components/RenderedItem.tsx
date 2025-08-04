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
import { DEFAULT_ITEM_SIZE } from '@/app/constants';

const baseClasses = 'aspect-square flex items-center justify-center font-medium select-none';

const UndraggableItem = (item: TierListItemModel, size: number) => {
	const itemStyle = {
		height: `calc(var(--spacing) * ${size})`,
		width: `calc(var(--spacing) * ${size})`,
	};

	let imageDiv = null;
	if (item.imageUrl) {
		imageDiv = (
			<Image
				src={item.imageUrl}
				height='100'
				width='100'
				alt='Tier list item'
				className='object-cover'
			/>
		);
	} else {
		const l = item.name.length;
		let textSize = l <= 3 ? 'text-xl' : l <= 5 ? 'text-base' : l <= 6 ? 'text-sm' : 'text-xs';
		const base = 1;
		// text-xl: 1.25rem
		// text-base: 1rem
		// text-sm: 0.75rem
		let maxBaseSize = 1.25;
		let itemSizeMultiplier = size / DEFAULT_ITEM_SIZE;
		let textSizeRem = Math.min(maxBaseSize, 5 / (l / 3)) * itemSizeMultiplier;
		// console.log(size);
		// console.log(textSize);

		imageDiv = (
			<span
				className='text-center w-full wrap-break-word'
				style={{ fontSize: `${textSizeRem}rem`, lineHeight: `(1 / ${textSizeRem}` }}
				// style={{ fontSize: `var(--${textSize})`, lineHeight: `var(--${textSize}--line-height)` }}
			>
				{item.name}
			</span>
		);
	}
	return (
		<div className='relative w-max'>
			<div className={`${baseClasses} peer bg-white text-wrap`} style={itemStyle}>
				{imageDiv}
			</div>

			<div className='absolute flex justify-center -top-9 left-0 right-0 invisible peer-hover:visible transition-opacity duration-200 text-nowrap'>
				<span className='bg-gray-800/80 px-2 py-1 rounded text-white font-bold cursor-default'>
					{item.name}
				</span>
			</div>
		</div>
	);
};

interface RenderedItemProps {
	item: TierListItemModel;
	// Height and width of the item
	size: number;
	isDraggable: boolean;
}

const RenderedItem: React.FC<RenderedItemProps> = ({ item, isDraggable, size }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
	});

	// TierListItem means this is a different user's ranking, so not draggable.
	if (item instanceof TierListItem || !isDraggable) {
		return <div className='relative h-fit'>{UndraggableItem(item, size)}</div>;
	}

	const style = {
		cursor: isDragging ? 'grabbing' : 'grab',
		// Hide this item if being dragged, the DndOverlay will display a copy
		opacity: isDragging ? '0' : '1',
		touchAction: 'none', // Important for touch devices
		transform: CSS.Translate.toString(transform),
	};

	return (
		<div className='relative h-fit' ref={setNodeRef} style={style} {...listeners} {...attributes}>
			{UndraggableItem(item, size)}
		</div>
	);
};

export default RenderedItem;
