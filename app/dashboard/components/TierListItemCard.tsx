// Represents a tier list when displayed in a list of tier lists.

import React from 'react';
import { TierList } from '../../model/TierList';
import { ActionButton } from '../../components/Button';
import Link from 'next/link';
import { getInitials } from '../../utils';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import { deleteTierList, leaveTierList } from '@/app/firebase/firebase_utils';

const truncateDescription = (text: string, maxLength: number) => {
	if (text.length > maxLength) {
		return text.substring(0, maxLength) + '...';
	}
	return text;
};

interface TierListItemCardProps {
	tierList: TierList;
	refreshCallback: () => void;
}

const TierListItemCard: React.FC<TierListItemCardProps> = ({ tierList, refreshCallback }) => {
	const { db, user } = useFirebase();

	if (!db || !user) {
		return;
	}

	const lastUpdateDate = tierList.lastUpdatedAt.toDate().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const initials = getInitials(tierList.creatorName);

	return (
		<div className='relative bg-white/50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full'>
			<Link
				className='px-4 py-2 absolute w-full h-full'
				href={`/dashboard/rank/${tierList.id}`}
			></Link>
			<div className='px-4 py-2 sm:px-8 sm:py-2 cursor-pointer'>
				{/* Tierlist Title */}
				<h3 className='text-3xl text-center font-bold text-gray-900 dark:text-white mb-2 line-clamp-2'>
					{tierList.name}
				</h3>

				{/* Description */}
				<div className='my-4'>
					<p className='text-gray-700 dark:text-gray-300 text-xl line-clamp-3'>
						{truncateDescription(tierList.description, 150)}
					</p>
				</div>
				<section className='flex justify-around'>
					<div className='flex items-center mb-2 space-x-4'>
						<div className='flex items-center justify-center h-14 w-14 bg-red-500'>
							<span className='text-white font-bold text-2xl tracking-widest'>{initials}</span>
						</div>
						<div className='text-xl'>
							<p className='text-gray-600 dark:text-gray-400'>
								Created by{' '}
								<span className='font-semibold text-blue-600 dark:text-blue-400'>
									{tierList.creatorName}
								</span>
							</p>
							<p className='text-gray-600 dark:text-gray-400'>
								Last Updated:
								<span className='font-semibold dark:text-blue-400'>{lastUpdateDate}</span>
							</p>
						</div>
					</div>
					{/* Actions like View, Edit, Share */}
					<div className='my-auto relative z-10'>
						<div className='px-4 py-1 flex justify-center space-x-8'>
							{tierList.editorIds.has(user.uid) && (
								<Link href={`/dashboard/edit/${tierList.id}`}>
									<ActionButton
										variant='outline'
										className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-0'
									>
										Edit
									</ActionButton>
								</Link>
							)}
							<ActionButton
								onClick={() => {}}
								variant='outline'
								className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium'
							>
								Share
							</ActionButton>
							{tierList.creatorId === user.uid ? (
								<ActionButton
									onClick={() => {
										deleteTierList(tierList.id, db);
										setTimeout(() => {
											refreshCallback();
										}, 1000);
									}}
									variant='outline'
									className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium'
								>
									Delete
								</ActionButton>
							) : (
								<ActionButton
									onClick={() => {
										leaveTierList(tierList.id, user.uid, db);
										setTimeout(() => {
											refreshCallback();
										}, 1000);
									}}
									variant='outline'
									className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium'
								>
									Leave
								</ActionButton>
							)}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default TierListItemCard;
