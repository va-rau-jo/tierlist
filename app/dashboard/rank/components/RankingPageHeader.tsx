import { ActionButton } from '@/app/components/Button';
import { useFirebase } from '@/app/components/providers/FirebaseProvider';
import { usePopup } from '@/app/components/providers/PopupProvider';
import { TierList } from '@/app/model/TierList';
import Link from 'next/link';

export const RankingPageHeader = ({ tierList }: { tierList: TierList }) => {
	const { showPopup } = usePopup();
	const { user } = useFirebase();

	if (!user) {
		return;
	}

	return (
		<>
			<h2 className='text-3xl font-bold mb-2 text-center'>{tierList.name}</h2>
			<div className='flex justify-center items-center space-x-8  py-2'>
				<span className='text-lg'> Description: {tierList.description} </span>
				<span className='text-lg'>
					Tier List Id:{' '}
					<span
						className='text-lg sm:text-sm my-auto cursor-pointer hover:text-gray-800'
						onClick={() => {
							navigator.clipboard.writeText(tierList.id);
							showPopup('Tierlist ID copied.', 'info');
						}}
						title='Click to copy ID'
					>
						{tierList.id}
					</span>
				</span>

				{tierList.creatorId === user.uid || tierList.editorIds.has(user.uid) ? (
					<Link href={`/dashboard/edit/${tierList.id}`}>
						<ActionButton variant='outline'>Edit</ActionButton>
					</Link>
				) : null}
			</div>
		</>
	);
};
