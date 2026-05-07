export type Pagination = {
	page: number;
	limit: number;
	search?: string;
};

export type PaginationMetadata = {
	totalRecords: number;
	page: number;
	recordsPerPage: number;
};

export type PaginationResponse<T> = {
	metadata: PaginationMetadata;
	data: T[];
};
