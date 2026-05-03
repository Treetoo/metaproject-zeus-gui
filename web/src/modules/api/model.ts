export enum Method {
	GET = 'get',
	POST = 'post',
	DELETE = 'delete'
}

export type ApiResponse<T = unknown> = {
	readonly status: number;
	readonly data: T;
	readonly type: string | null;
};

export type ApiClientErrorResponse = {
	readonly data: {
		readonly code: number;
		readonly message: string;
	};
} & ApiResponse;

export class ApiClientError extends Error {
	constructor(
		m: string,
		readonly response: ApiClientErrorResponse
	) {
		super(m);
		this.name = 'ApiClientError';
		Object.setPrototypeOf(this, ApiClientError.prototype);
	}
}
