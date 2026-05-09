import { download } from '@/modules/api/request';

export type ExportPublicationsParams = {
	status?: string;
	search?: string;
	startDate?: string;
	endDate?: string;
	fields?: string[];
};

export const exportPublicationRequests = async (params: ExportPublicationsParams) => {
	const searchParams = new URLSearchParams();
	if (params.status && params.status !== 'all') {
		searchParams.set('status', params.status);
	}
	if (params.search?.trim()) {
		searchParams.set('search', params.search.trim());
	}
	if (params.startDate) {
		searchParams.set('startDate', params.startDate);
	}
	if (params.endDate) {
		searchParams.set('endDate', params.endDate);
	}
	if (params.fields && params.fields.length > 0) {
		searchParams.set('fields', params.fields.join(','));
	}

	return download(`/publications/approval/export?${searchParams}`, {
		headers: {
			Accept: 'text/csv'
		}
	});
};

export const exportCreditRequests = async (params: ExportPublicationsParams) => {
	const searchParams = new URLSearchParams();
	if (params.status && params.status !== 'all') {
		searchParams.set('status', params.status);
	}
	if (params.search?.trim()) {
		searchParams.set('search', params.search.trim());
	}
	if (params.startDate) {
		searchParams.set('startDate', params.startDate);
	}
	if (params.endDate) {
		searchParams.set('endDate', params.endDate);
	}
	if (params.fields && params.fields.length > 0) {
		searchParams.set('fields', params.fields.join(','));
	}

	return download(`/publications/credit-approval/export?${searchParams}`, {
		headers: {
			Accept: 'text/csv'
		}
	});
};
