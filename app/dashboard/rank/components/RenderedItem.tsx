/**
 * A component that renders a draggable or non-draggable item in a tier list.
 * Items can display an image or a placeholder letter, with a hover (desktop)
 * or long-press (mobile) tooltip showing the item name.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useDraggable } from '@dnd-kit/core';
import { TierListItem, TierListItemModel } from '../../../model/TierListItem';
import Image from 'next/image';
import ErrorIcon from '@/app/components/icons/ErrorIcon';
import { ImageLoadStatus, useImageStatus } from '@/app/components/providers/ImageLoaderProvider';
import { truncateText } from '@/app/utils';
import { DEFAULT_ITEM_SIZE } from '@/app/constants';

const baseClasses = 'aspect-square flex items-center justify-center font-medium select-none';
const LONG_PRESS_MS = 450;
const TOOLTIP_VISIBLE_MS = 2000;
const MOVE_CANCEL_PX = 10;

interface UndraggableItemProps {
	item: TierListItemModel;
	itemSize: number;
	forceHideTooltip?: boolean;
	onLongPressActivate?: () => void;
	onLongPressGestureEnd?: () => void;
}

const UndraggableItem: React.FC<UndraggableItemProps> = ({
	item,
	itemSize,
	forceHideTooltip = false,
	onLongPressActivate,
	onLongPressGestureEnd,
}) => {
	const imageStatus = useImageStatus(item.imageUrl);
	const [showTooltip, setShowTooltip] = useState(false);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hideTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
	const longPressActivatedRef = useRef(false);

	const clearLongPressTimer = () => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	};

	const clearHideTooltipTimer = () => {
		if (hideTooltipTimerRef.current) {
			clearTimeout(hideTooltipTimerRef.current);
			hideTooltipTimerRef.current = null;
		}
	};

	const hideTooltip = () => {
		clearHideTooltipTimer();
		setShowTooltip(false);
	};

	const revealTooltipTemporarily = () => {
		clearHideTooltipTimer();
		setShowTooltip(true);
		hideTooltipTimerRef.current = setTimeout(() => {
			setShowTooltip(false);
			hideTooltipTimerRef.current = null;
		}, TOOLTIP_VISIBLE_MS);
	};

	const endLongPressGesture = () => {
		clearLongPressTimer();
		touchStartPosRef.current = null;
		if (longPressActivatedRef.current) {
			longPressActivatedRef.current = false;
			onLongPressGestureEnd?.();
		}
	};

	useEffect(() => {
		return () => {
			clearLongPressTimer();
			clearHideTooltipTimer();
		};
	}, []);

	useEffect(() => {
		if (forceHideTooltip) {
			clearLongPressTimer();
			clearHideTooltipTimer();
			setShowTooltip(false);
		}
	}, [forceHideTooltip]);

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
				unoptimized
			/>
		);
	} else if (item.imageUrl && imageStatus === ImageLoadStatus.LOADED) {
		imageDiv = (
			<Image
				src={item.imageUrl}
				height='100'
				width='100'
				alt={item.name}
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

	const tooltipVisible = showTooltip && !forceHideTooltip;

	return (
		<div
			className='relative w-max'
			onMouseEnter={() => {
				if (window.matchMedia('(hover: hover)').matches) {
					clearHideTooltipTimer();
					setShowTooltip(true);
				}
			}}
			onMouseLeave={() => {
				if (window.matchMedia('(hover: hover)').matches) {
					hideTooltip();
				}
			}}
			onTouchStart={(e) => {
				const touch = e.touches[0];
				touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
				longPressActivatedRef.current = false;
				clearLongPressTimer();
				longPressTimerRef.current = setTimeout(() => {
					longPressTimerRef.current = null;
					longPressActivatedRef.current = true;
					onLongPressActivate?.();
					revealTooltipTemporarily();
				}, LONG_PRESS_MS);
			}}
			onTouchMove={(e) => {
				if (!touchStartPosRef.current || longPressActivatedRef.current) {
					return;
				}
				const touch = e.touches[0];
				const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
				const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
				if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
					// User is dragging — cancel pending long-press tooltip.
					clearLongPressTimer();
				}
			}}
			onTouchEnd={endLongPressGesture}
			onTouchCancel={endLongPressGesture}
			onContextMenu={(e) => {
				// Avoid the native callout stealing the long-press on mobile.
				if (!window.matchMedia('(hover: hover)').matches) {
					e.preventDefault();
				}
			}}
		>
			<div className={`${baseClasses} bg-white text-wrap`} style={itemStyle}>
				{imageDiv}
			</div>

			<div
				className={`pointer-events-none absolute z-100 flex justify-center -top-9 left-0 right-0 text-nowrap transition-opacity duration-200 ${
					tooltipVisible ? 'visible opacity-100' : 'invisible opacity-0'
				}`}
			>
				<span className='rounded bg-gray-800/80 px-2 py-1 font-bold text-white'>
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
	const [dragLockedByLongPress, setDragLockedByLongPress] = useState(false);

	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: item.id,
		disabled: dragLockedByLongPress,
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
		<div
			className='relative h-fit'
			ref={setNodeRef}
			style={style}
			{...(dragLockedByLongPress ? {} : listeners)}
			{...attributes}
		>
			<UndraggableItem
				item={item}
				itemSize={itemSize}
				forceHideTooltip={isDragging}
				onLongPressActivate={() => setDragLockedByLongPress(true)}
				onLongPressGestureEnd={() => setDragLockedByLongPress(false)}
			/>
		</div>
	);
};

export default RenderedItem;
