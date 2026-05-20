import { Method } from '@/modules/api/model';
import { request } from '@/modules/api/request';

export type ApprovePublicationDto = {
	publicationId: number;
	weight?: number;
	reviewerNote?: string;
};

export const approvePublication = async (data: ApprovePublicationDto) => {
	data.weight = data.weight ?? 1;
	await request(`/publications/request/${data.publicationId}/approve`, {
		method: Method.POST,
		json: data
	});
};

export const rejectPublication = async (data: ApprovePublicationDto) => {
	await request(`/publications/request/${data.publicationId}/reject`, {
		method: Method.POST,
		json: data
	});
};

export const approveCreditRequest = async (data: ApprovePublicationDto) => {
	data.weight = data.weight ?? 1;
	await request(`/publications/credit/${data.publicationId}/approve`, {
		method: Method.POST,
		json: data
	});
};

export const rejectCreditRequest = async (data: ApprovePublicationDto) => {
	await request(`/publications/credit/${data.publicationId}/reject`, {
		method: Method.POST,
		json: data
	});
};
