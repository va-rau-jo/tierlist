// Represents a tier list when displayed in a list of tier lists.

import React, { useEffect, useState } from 'react';
import { TierList } from '../../model/TierList';
import { ActionButton } from '../../components/Button';
import Link from 'next/link';
import { getInitials, truncateText } from '../../utils';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { deleteTierList, FirebaseReturnStatus, leaveTierList } from '@/app/firebase/firebase_utils';
import { usePopup } from '@/app/components/providers/PopupProvider';
import { useUserNames } from '@/app/components/providers/UserNamesProvider';

interface TierListItemCardProps {
	tierList: TierList;
	refreshCallback: () => void;
}

// Displays the create and join actions at the top of the page.
const ActionButtonContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
	children,
	className,
}) => {
	return <div className={`${className} z-10`}>{children}</div>;
};

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
		return;
	}

	const creatorInitials = getInitials(creatorUserName);

	const lastUpdateDate = tierList.lastUpdatedAt.toDate().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const handleDeleteOnClick = () => {
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

	const handleLeaveOnClick = () => {
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

	const handleShareOnClick = () => {
		navigator.clipboard.writeText(tierList.id);
		showPopup(
			`Add them as a ranker, and have them join using ID: ${tierList.id} (copied).`,
			'info',
			5000
		);
	};

	const privateDivBaseClasses = 'absolute top-1 right-1 text-sm font-bold rounded-full px-2 py-1';
	const canEdit = tierList.creatorId === user.uid || tierList.editorIds.has(user.uid);
	return (
		<div className='relative bg-white/50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full'>
			<Link
				className='px-4 py-2 absolute w-full h-full'
				href={`/dashboard/rank/${tierList.id}`}
			></Link>
			<div className='flex flex-col items-center px-2 py-2 sm:px-4 cursor-pointer'>
				{tierList.isPrivate ? (
					<div className={`${privateDivBaseClasses} bg-red-200`}>Private</div>
				) : (
					<div className={`${privateDivBaseClasses} bg-blue-200`}>Public</div>
				)}
				<h3
					className='text-xl md:text-2xl lg:text-3xl text-center font-bold text-gray-900 dark:text-white line-clamp-2'
					title={tierList.name}
				>
					{truncateText(tierList.name, 30)}
				</h3>
				<div className='my-2'>
					<p className='text-gray-700 dark:text-gray-300 text-base md:text-lg line-clamp-3'>
						{truncateText(tierList.description, 175)}
					</p>
				</div>
				<section className='flex justify-around'>
					<div className='flex items-center mb-2 space-x-2 w-full'>
						<div className='flex items-center justify-center h-14 w-14 bg-red-500'>
							<span className='text-white font-bold text-2xl tracking-widest'>
								{creatorInitials}
							</span>
						</div>
						<div className='text-sm md:text-base text-nowrap tracking-tight'>
							<p className='text-gray-600 dark:text-gray-400'>
								Created by{' '}
								<span className='font-semibold text-blue-600 dark:text-blue-400'>
									{creatorUserName}
								</span>
							</p>
							<p className='text-gray-600 dark:text-gray-400'>
								Last Updated:{' '}
								<span className='font-semibold dark:text-blue-400'>{lastUpdateDate}</span>
							</p>
						</div>
					</div>
					{/* Actions like View, Edit, Share */}
					<div className='text-sm md:text-base flex flex-wrap my-auto w-full ml-6 py-1 justify-center'>
						{canEdit && (
							<ActionButtonContainer className='m-0.5'>
								<Link href={`/dashboard/edit/${tierList.id}`}>
									<ActionButton variant='outline'>Edit</ActionButton>
								</Link>
							</ActionButtonContainer>
						)}
						<ActionButtonContainer className='m-0.5'>
							<ActionButton onClick={handleShareOnClick} variant='outline'>
								Share
							</ActionButton>
						</ActionButtonContainer>
						<ActionButtonContainer className='m-0.5'>
							{tierList.creatorId === user.uid ? (
								<ActionButton onClick={handleDeleteOnClick} variant='outline'>
									{deleteButtonText}
								</ActionButton>
							) : (
								<ActionButton onClick={handleLeaveOnClick} variant='outline'>
									{leaveButtonText}
								</ActionButton>
							)}
						</ActionButtonContainer>
					</div>
				</section>
			</div>
		</div>
	);
};

export default TierListItemCard;
