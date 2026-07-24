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
import ErrorIcon from '@/app/components/icons/ErrorIcon';
import { ImageLoadStatus, useImageStatus } from '@/app/components/providers/ImageLoaderProvider';
import { truncateText } from '@/app/utils';
import { DEFAULT_ITEM_SIZE } from '@/app/constants';

const baseClasses = 'aspect-square flex items-center justify-center font-medium select-none';

const UndraggableItem: React.FC<{ item: TierListItemModel; itemSize: number }> = ({
	item,
	itemSize,
}) => {
	const imageStatus = useImageStatus(item.imageUrl);

	const itemStyle = {
		height: `calc(var(--spacing) * ${itemSize})`,
		width: `calc(var(--spacing) * ${itemSize})`,
	};

	let imageDiv = null;

	if (item.imageUrl && imageStatus === ImageLoadStatus.LOADING) {
		imageDiv = (
			<Image
				src='/loading_black.gif'
				height='50'
				width='50'
				alt='Loading...'
				className='object-cover'
			/>
		);
	} else if (item.imageUrl && imageStatus === ImageLoadStatus.LOADED) {
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
		const itemName = truncateText(item.name, 40);
		const lengthSizeRatio = 1 + 0.1 * Math.floor(item.name.length / 4);

		const baseSize = 1.25;
		const textSizeRem =
			Math.max(baseSize / 2, baseSize / lengthSizeRatio) * (itemSize / DEFAULT_ITEM_SIZE);

		imageDiv = (
			<>
				{item.imageUrl && imageStatus === ImageLoadStatus.FAILED ? (
					<div className='absolute top-0 right-0 text-red-500 rounded-sm'>
						<ErrorIcon />
					</div>
				) : null}
				<span
					className='bg-white text-center w-full wrap-break-word'
					style={{ fontSize: `${textSizeRem}rem` }}
				>
					{itemName}
				</span>
			</>
		);
	}
	return (
		<div className='relative w-max'>
			<div className={`${baseClasses} bg-white peer text-wrap`} style={itemStyle}>
				{imageDiv}
			</div>

			<div className='absolute z-100 flex justify-center -top-9 left-0 right-0 invisible peer-hover:visible transition-opacity duration-200 text-nowrap'>
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
	itemSize: number;
	isDraggable: boolean;
}

const RenderedItem: React.FC<RenderedItemProps> = ({ item, isDraggable, itemSize }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
	});

	// TierListItem means this is a different user's ranking, so not draggable.
	if (item instanceof TierListItem || !isDraggable) {
		return (
			<div className='relative h-fit'>
				<UndraggableItem item={item} itemSize={itemSize} />
			</div>
		);
	}

	const style = {
		cursor: isDragging ? 'grabbing' : 'grab',
		// Hide this item if being dragged, the DndOverlay will display a copy
		opacity: isDragging ? '0' : '1',
		touchAction: 'none',
		transform: CSS.Translate.toString(transform),
	};
	return (
		<div className='relative h-fit' ref={setNodeRef} style={style} {...listeners} {...attributes}>
			<UndraggableItem item={item} itemSize={itemSize} />
		</div>
	);
};

export default RenderedItem;
