// Represents a tier list when displayed in a list of tier lists.

import React from 'react';
import { TierList } from '../model/TierList';
import Link from 'next/link'; // For linking to individual tier list pages
import { Button } from './Button';
import { useRouter } from 'next/navigation';

interface TierListItemCardProps {
	tierList: TierList;
}

const TierListItemCard: React.FC<TierListItemCardProps> = ({ tierList }) => {
	const router = useRouter();

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
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden w-full'>
			<div className='p-4 sm:p-6'>
				<div className='flex items-center mb-2 space-x-8'>
					<div className='flex items-center justify-center h-16 w-16 bg-red-500'>
						<span className='text-white font-bold text-2xl tracking-widest'>{initials}</span>
					</div>
					<div className='text-xl mr-8'>
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

				<h3 className='text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2'>
					{tierList.name}
				</h3>

				{/* Description */}
				<p className='text-gray-700 dark:text-gray-300 text-sm line-clamp-3'>
					{truncateDescription(tierList.description, 150)}
				</p>
			</div>

			{/* Optional: Actions like View, Edit, Share (can be outside the Link for more complex layouts) */}
			<div className='p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-8'>
				<Button
					onClick={() => router.push(`/dashboard/edit/${tierList.id}`)}
					className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm'
				>
					Edit
				</Button>
				<Link
					href={`/tierlists/${tierList.id}`}
					className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm'
				>
					Rank
				</Link>
				<Link
					href={`/tierlists/${tierList.id}`}
					className='text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm'
				>
					Share
				</Link>
			</div>
		</div>
	);
};

export default TierListItemCard;
