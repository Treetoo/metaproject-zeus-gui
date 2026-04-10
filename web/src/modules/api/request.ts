import ky, { type KyResponse, type Options } from 'ky';

import { Method } from '@/modules/api/model';
import userManager from '@/modules/auth/config/user-manager';
import { getStepUpAccess } from '@/modules/auth/methods/getStepUpAccess';
import { StepUpAccess } from '@/modules/auth/model';

export const request = async <T>(url: string, init?: Options): Promise<T> => {
	const response = await requestWrapper<T>(url, init);
	const responseText = await response.text();

	if (!responseText) {
		// Return undefined for empty responses - callers should handle this case
		// This commonly happens with 204 No Content or successful mutations
		return undefined as unknown as T;
	}

	return JSON.parse(responseText);
};

export const download = async (url: string, init?: RequestInit) => {
	const request = await requestWrapper<Blob>(url, init);
	return request.blob();
};

const requestWrapper = async <T>(url: string, init?: Options): Promise<KyResponse<T>> => {
	const stepUpAccess = getStepUpAccess();
	const abortController = new AbortController();
	const signal = abortController.signal;

	const defaultHeaders: Record<string, string> = {};

	const user = await userManager.getUser();
	const accessToken = user?.access_token;
	if (accessToken) {
		defaultHeaders.Authorization = `Bearer ${accessToken}`;
	}

	// if user has step up access, mark in request
	if (stepUpAccess === StepUpAccess.LOGGED) {
		defaultHeaders['X-Step-Up'] = 'true';
	}

	return ky<T>(window.Config.VITE_API_URL + url, {
		method: Method.GET,
		signal,
		...init,
		headers: {
			...defaultHeaders,
			...getHeaders(init?.headers)
		}
	});
};

const getHeaders = (
	headers?: NonNullable<RequestInit['headers']> | Record<string, string | undefined>
): Record<string, string> => {
	if (!headers) {
		return {};
	}

	const headersObject: Record<string, string> = {};

	if (headers instanceof Headers) {
		headers.forEach((value, key) => {
			headersObject[key] = value;
		});
		return headersObject;
	}

	if (Array.isArray(headers)) {
		headers.forEach(header => {
			headersObject[header[0]] = header[1];
		});
		return headersObject;
	}

	for (const key in headers) {
		const value = headers[key];
		if (value !== undefined) {
			headersObject[key] = value;
		}
	}

	return headersObject;
};
