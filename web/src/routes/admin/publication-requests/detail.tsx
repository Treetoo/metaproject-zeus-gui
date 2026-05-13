import { ReviewDetail } from '@/components/publications/review-detail';
import { approvePublication, rejectPublication } from '@/modules/publication/api/approve-publication';
import { type ApprovalFormData } from '@/modules/publication/approval-form';
import { type Publication } from '@/modules/publication/model';

type PublicationApprovalDetailProps = {
	opened: boolean;
	onClose: () => void;
	publication: Publication | null;
	onApproved?: () => void;
	onRejected?: () => void;
};

export const PublicationApprovalDetail = ({
	opened,
	onClose,
	publication,
	onApproved,
	onRejected
}: PublicationApprovalDetailProps) => {
	const handleApprove = async (data: ApprovalFormData) => {
		if (!publication?.id) return;
		await approvePublication({ ...data, publicationId: publication.id });
	};

	const handleReject = async (data: ApprovalFormData) => {
		if (!publication?.id) return;
		await rejectPublication({ ...data, publicationId: publication.id });
	};

	return (
		<ReviewDetail
			opened={opened}
			onClose={onClose}
			publication={publication}
			title="Publication"
			statusLabel="Status"
			successMessage="Publication approved successfully"
			rejectMessage="Publication rejected"
			failureMessage="Failed to approve publication"
			queryKey={['publications', 'approval', 'pending']}
			showWeight
			showDetails
			onApproved={onApproved}
			onRejected={onRejected}
			onApprove={handleApprove}
			onReject={handleReject}
		/>
	);
};
