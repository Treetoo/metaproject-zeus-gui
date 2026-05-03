import { Method } from '@/modules/api/model';
import { request } from '@/modules/api/request';

export type ApprovePublicationRequest = {
	publicationId: number;
	weight?: number;
};

export const approvePublication = async ({ publicationId, weight }: ApprovePublicationRequest) => {
	await request(`/publications/approval/${publicationId}/approve`, {
		method: Method.POST,
		json: { weight: weight ?? 1 }
	});
};

export const rejectPublication = async ({ publicationId }: ApprovePublicationRequest) => {
	await request(`/publications/approval/${publicationId}/reject`, {
		method: Method.POST
	});
};
