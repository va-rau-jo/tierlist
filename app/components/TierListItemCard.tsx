// Represents a tier list when displayed in a list of tier lists.

import React from 'react';
import { TierList } from '../model/TierList';
import Link from 'next/link'; // For linking to individual tier list pages
import { ActionButton } from './Button';
import { useRouter } from 'next/navigation';

interface TierListItemCardProps {
	tierList: TierList;
}

const TierListItemCard: React.FC<TierListItemCardProps> = ({ tierList }) => {
	const router = useRouter();

	const navigateToRankView = () => {
		router.push(`/dashboard/rank/${tierList.id}`);
	};

	const navigateToEditView = (e: React.MouseEvent) => {
		e.stopPropagation();
		router.push(`/dashboard/edit/${tierList.id}`);
	};

	// Optional: Function to truncate description if it's too long
	const truncateDescription = (text: string, maxLength: number) => {
		if (text.length > maxLength) {
			return text.substring(0, maxLength) + '...';
		}
		return text;
	};

	const lastUpdateDate = tierList.lastUpdatedAt.toDate().toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const initials = tierList.creatorName
		.split(' ')
		.map((name) => name[0])
		.join('');

	console.log(tierList);

	return (
		<div className='bg-white/50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full'>
			<div className='px-4 py-2 sm:px-8 sm:py-2 cursor-pointer' onClick={navigateToRankView}>
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
					<div className='my-auto'>
						<div className='px-4 py-1 flex justify-center space-x-8'>
							<ActionButton
								onClick={navigateToEditView}
								variant='outline'
								className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-0'
							>
								Edit
							</ActionButton>
							<ActionButton
								onClick={() => {}}
								variant='outline'
								className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium'
							>
								Share
							</ActionButton>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default TierListItemCard;
