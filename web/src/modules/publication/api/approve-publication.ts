import { Method } from '@/modules/api/model';
import { request } from '@/modules/api/request';

export type ApprovePublicationDto = {
	publicationId: number;
	weight?: number;
	reviewerNote?: string;
};

export const approvePublication = async (data: ApprovePublicationDto) => {
	data.weight = data.weight ?? 1;
	await request(`/publications/approval/${data.publicationId}/approve`, {
		method: Method.POST,
		json: data
	});
};

export const rejectPublication = async (data: ApprovePublicationDto) => {
	await request(`/publications/approval/${data.publicationId}/reject`, {
		method: Method.POST,
		json: data
	});
};
