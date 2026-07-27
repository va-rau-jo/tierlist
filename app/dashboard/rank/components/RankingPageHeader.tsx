import { ActionButton } from '@/app/components/Button';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { TierList } from '@/app/model/TierList';
import { truncateText } from '@/app/utils';
import Link from 'next/link';

export const RankingPageHeader = ({ tierList }: { tierList: TierList }) => {
	const { user } = useFirebase();

	if (!user) {
		return;
	}

	const tierListName = truncateText(tierList.name, 100);
	const description = truncateText(tierList.description, 700);

	return (
		<>
			<h2 className='text-3xl font-bold mb-2 text-center'>{tierListName}</h2>
			<div className='flex justify-between items-center space-x-8 py-2'>
				<div className='text-lg w-1/2'>
					<b>Description:</b> <span className='text-base'>{description}</span>
				</div>

				{tierList.creatorId === user.uid || tierList.editorIds.has(user.uid) ? (
					<Link href={`/dashboard/edit?id=${tierList.id}`}>
						<ActionButton variant='outline'>Edit Tierlist</ActionButton>
					</Link>
				) : null}
			</div>
		</>
	);
};
