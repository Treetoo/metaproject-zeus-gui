import { ReviewDetail } from '@/components/publications/review-detail';
import { approveCreditRequest, rejectCreditRequest } from '@/modules/publication/api/approve-publication';
import { type ApprovalFormData } from '@/modules/publication/approval-form';
import { type Publication } from '@/modules/publication/model';

type CreditRequestDetailProps = {
	opened: boolean;
	onClose: () => void;
	publication: Publication | null;
	onApproved?: () => void;
	onRejected?: () => void;
};

export const CreditRequestDetail = ({
	opened,
	onClose,
	publication,
	onApproved,
	onRejected
}: CreditRequestDetailProps) => {
	const handleApprove = async (data: ApprovalFormData) => {
		if (!publication?.id) return;
		await approveCreditRequest({ ...data, publicationId: publication.id });
	};

	const handleReject = async (data: ApprovalFormData) => {
		if (!publication?.id) return;
		await rejectCreditRequest({ ...data, publicationId: publication.id });
	};

	return (
		<ReviewDetail
			opened={opened}
			onClose={onClose}
			publication={publication}
			title="Credit Request"
			statusLabel="Credit Status"
			successMessage="Credit request approved successfully"
			rejectMessage="Credit request rejected"
			failureMessage="Failed to approve credit request"
			queryKey={['publications', 'credit-requests']}
			showWeight={false}
			showDetails
			onApproved={onApproved}
			onRejected={onRejected}
			onApprove={handleApprove}
			onReject={handleReject}
		/>
	);
};
