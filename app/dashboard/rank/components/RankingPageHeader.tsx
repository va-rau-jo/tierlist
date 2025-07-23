import { ActionButton } from '@/app/components/Button';
import { TierList } from '@/app/model/TierList';
import Link from 'next/link';

export const RankingPageHeader = ({ tierList, userId }: { tierList: TierList; userId: string }) => {
	return (
		<>
			<h2 className='text-3xl font-bold mb-2 text-center'>Rank {tierList.name}</h2>
			<div className='flex justify-center items-center space-x-8  py-2'>
				<span className='text-lg'> Description: {tierList.description} </span>
				<span className='text-lg'> Tier List Id: {tierList.id} </span>
				{tierList.editorIds.has(userId) && (
					<Link href={`/dashboard/edit/${tierList.id}`}>
						<ActionButton variant='outline'>Edit</ActionButton>
					</Link>
				)}
			</div>
		</>
	);
};
