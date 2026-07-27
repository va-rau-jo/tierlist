// Represents a tier list when displayed in a list of tier lists.

import React, { useEffect, useState } from 'react';
import { TierList } from '../../model/TierList';
import { ActionButton } from '../../components/Button';
import Link from 'next/link';
import { getInitials } from '../../utils';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { deleteTierList, FirebaseReturnStatus, leaveTierList } from '@/app/firebase/firebase_utils';
import { usePopup } from '@/app/components/providers/PopupProvider';
import { useUserNames } from '@/app/components/providers/UserNamesProvider';

interface TierListItemCardProps {
	tierList: TierList;
	refreshCallback: () => void;
}

const TierListItemCard: React.FC<TierListItemCardProps> = ({ tierList, refreshCallback }) => {
	const { db, user } = useFirebase();
	const { showPopup } = usePopup();
	const { fetchUserName } = useUserNames();
	const [deleteButtonText, setDeleteButtonText] = useState('Delete');
	const [leaveButtonText, setLeaveButtonText] = useState('Leave');
	const [creatorUserName, setCreatorUserName] = useState('');

	useEffect(() => {
		if (db && tierList.creatorId) {
			fetchUserName(tierList.creatorId).then((name) => {
				if (typeof name === 'string') {
					setCreatorUserName(name);
				}
			});
		}
	}, [db, fetchUserName, tierList.creatorId]);

	if (!db || !user) {
		return null;
	}

	const creatorInitials = getInitials(creatorUserName) || '?';

	const lastUpdateDate = tierList.lastUpdatedAt.toDate().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});

	const handleDeleteOnClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDeleteButtonText('Deleting...');
		deleteTierList(tierList.id, user.uid, db).then((status) => {
			if (status === FirebaseReturnStatus.OK) {
				refreshCallback();
				showPopup('Tierlist deleted.', 'success');
			} else if (status === FirebaseReturnStatus.TIER_LIST_NOT_DELETED_ERROR) {
				showPopup('Error deleting the tierlist.', 'error');
			} else {
				showPopup('Something went wrong.', 'error');
			}
			setDeleteButtonText('Delete');
		});
	};

	const handleLeaveOnClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setLeaveButtonText('Leaving...');
		leaveTierList(tierList.id, user.uid, db).then((status) => {
			if (status === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
				showPopup('Error leaving the tierlist.', 'error');
			} else {
				refreshCallback();
				showPopup('Tierlist left.', 'success');
			}
			setLeaveButtonText('Leave');
		});
	};

	const handleShareOnClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigator.clipboard.writeText(tierList.id);
		showPopup(
			`Add them as a ranker, and have them join using ID: ${tierList.id} (copied).`,
			'info',
			5000
		);
	};

	const canEdit = tierList.creatorId === user.uid || tierList.editorIds.has(user.uid);

	return (
		<article className='group relative flex min-w-0 flex-col gap-3 rounded-lg border border-slate-200/90 bg-[var(--board-card)] p-3 shadow-sm transition-shadow hover:shadow-md'>
			<Link
				href={`/dashboard/rank?id=${tierList.id}`}
				className='absolute inset-0 z-0 rounded-lg'
				aria-label={`Open ${tierList.name}`}
			/>

			<div className='relative z-10 pointer-events-none flex min-w-0 items-start justify-between gap-2'>
				<h3
					className='min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-slate-900 line-clamp-2'
					title={tierList.name}
				>
					{tierList.name}
				</h3>
				<span
					className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
						tierList.isPrivate
							? 'bg-rose-100 text-rose-700'
							: 'bg-emerald-100 text-emerald-700'
					}`}
				>
					{tierList.isPrivate ? 'Private' : 'Public'}
				</span>
			</div>

			{tierList.description ? (
				<p
					className='relative z-10 pointer-events-none min-w-0 break-words text-xs leading-relaxed text-slate-500 line-clamp-2'
					title={tierList.description}
				>
					{tierList.description}
				</p>
			) : null}

			<div className='relative z-10 mt-auto flex min-w-0 items-center gap-2 border-t border-slate-100 pt-2'>
				<div
					className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold tracking-wide text-white'
					title={creatorUserName}
				>
					{creatorInitials.slice(0, 2).toUpperCase()}
				</div>
				<div className='min-w-0 flex-1'>
					<p className='truncate text-xs text-slate-600' title={creatorUserName}>
						{creatorUserName || 'Unknown'}
					</p>
					<p className='truncate text-[11px] text-slate-400'>Updated {lastUpdateDate}</p>
				</div>
			</div>

			<div className='relative z-10 flex min-w-0 flex-wrap gap-1.5'>
				{canEdit && (
					<Link href={`/dashboard/edit?id=${tierList.id}`} className='pointer-events-auto'>
						<ActionButton variant='outline' className='!px-2.5 !py-0.5 !text-xs !shadow-none'>
							Edit
						</ActionButton>
					</Link>
				)}
				<ActionButton
					onClick={handleShareOnClick}
					variant='outline'
					className='pointer-events-auto !px-2.5 !py-0.5 !text-xs !shadow-none'
				>
					Share
				</ActionButton>
				{tierList.creatorId === user.uid ? (
					<ActionButton
						onClick={handleDeleteOnClick}
						variant='outline'
						className='pointer-events-auto !px-2.5 !py-0.5 !text-xs !shadow-none'
					>
						{deleteButtonText}
					</ActionButton>
				) : (
					<ActionButton
						onClick={handleLeaveOnClick}
						variant='outline'
						className='pointer-events-auto !px-2.5 !py-0.5 !text-xs !shadow-none'
					>
						{leaveButtonText}
					</ActionButton>
				)}
			</div>
		</article>
	);
};

export default TierListItemCard;
