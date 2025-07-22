/**
 *  A droppable area for draggable items. Used for the unassigned tier, as
 *  TierRow handles the droppable area logic for tier rows.
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableAreaProps {
	id: string;
	className?: string;
	children: React.ReactNode;
}

export function DroppableArea(props: DroppableAreaProps) {
	const { setNodeRef } = useDroppable({
		id: props.id,
	});

	return (
		<div ref={setNodeRef} className={props.className}>
			{props.children}
		</div>
	);
}
