// Represents a tier list when displayed in a list of tier lists.

import React, { useState } from 'react';
import { TierList } from '../../model/TierList';
import { ActionButton } from '../../components/Button';
import Link from 'next/link';
import { getInitials, truncateText } from '../../utils';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import { deleteTierList, FirebaseReturnStatus, leaveTierList } from '@/app/firebase/firebase_utils';
import { usePopup } from '@/app/components/popup/PopupContext';

interface TierListItemCardProps {
	tierList: TierList;
	refreshCallback: () => void;
}

// Displays the create and join actions at the top of the page.
const ActionButtonContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	return <div className='z-10'>{children}</div>;
};

const TierListItemCard: React.FC<TierListItemCardProps> = ({ tierList, refreshCallback }) => {
	const { db, user } = useFirebase();
	const { showPopup } = usePopup();
	const [deleteButtonText, setDeleteButtonText] = useState('Delete');
	const [leaveButtonText, setLeaveButtonText] = useState('Leave');

	if (!db || !user) {
		return;
	}

	const lastUpdateDate = tierList.lastUpdatedAt.toDate().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const initials = getInitials(tierList.creatorName);

	const handleDeleteOnClick = () => {
		setDeleteButtonText('Deleting...');
		deleteTierList(tierList.id, db).then((status) => {
			if (status === FirebaseReturnStatus.TIERLIST_NOT_FOUND_ERROR) {
				showPopup('Error deleting the tierlist.', 'error');
			} else {
				refreshCallback();
				showPopup('Tierlist deleted.', 'success');
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
		showPopup(`Copied tierlist ID ${tierList.id}.`, 'info', 1000);
	};

	return (
		<div className='relative bg-white/50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full'>
			<Link
				className='px-4 py-2 absolute w-full h-full'
				href={`/dashboard/rank/${tierList.id}`}
			></Link>
			<div className='px-4 py-2 sm:px-8 sm:py-2 cursor-pointer'>
				<h3 className='text-3xl text-center font-bold text-gray-900 dark:text-white line-clamp-2'>
					{truncateText(tierList.name, 50)}
				</h3>
				<div className='my-2'>
					<p className='text-gray-700 dark:text-gray-300 text-lg line-clamp-3'>
						{truncateText(tierList.description, 175)}
					</p>
				</div>
				<section className='flex justify-around'>
					<div className='flex items-center mb-2 space-x-4 w-full'>
						<div className='flex items-center justify-center h-14 w-14 bg-red-500'>
							<span className='text-white font-bold text-2xl tracking-widest'>{initials}</span>
						</div>
						<div className='text-lg'>
							<p className='text-gray-600 dark:text-gray-400'>
								Created by{' '}
								<span className='font-semibold text-blue-600 dark:text-blue-400'>
									{tierList.creatorName}
								</span>
							</p>
							<p className='text-gray-600 dark:text-gray-400'>
								Last Updated:{' '}
								<span className='font-semibold dark:text-blue-400'>{lastUpdateDate}</span>
							</p>
						</div>
					</div>
					{/* Actions like View, Edit, Share */}
					<div className='flex my-auto w-full pl-4 py-1 justify-center space-x-4'>
						{tierList.editorIds.has(user.uid) && (
							<ActionButtonContainer>
								<Link href={`/dashboard/edit/${tierList.id}`}>
									<ActionButton variant='outline'>Edit</ActionButton>
								</Link>
							</ActionButtonContainer>
						)}
						<ActionButtonContainer>
							<ActionButton onClick={handleShareOnClick} variant='outline'>
								Share
							</ActionButton>
						</ActionButtonContainer>
						<ActionButtonContainer>
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
