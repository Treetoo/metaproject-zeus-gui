import { request } from '@/modules/api/request';
import { Method } from '@/modules/api/model';
import { type UserInfo } from '@/modules/user/model';

/**
 * Mock sign-in data
 */
export type MockSignInData = {
	externalId: string;
	username: string;
	email: string;
	name: string;
	role: 'admin' | 'director' | 'user';
	locale?: string;
};

/**
 * Mock user project info
 */
export type MockUserProject = {
	id: number;
	title: string;
	status: string;
	role: string;
	memberRole?: string;
	isPersonal: boolean;
};

/**
 * Mock user preview response
 */
export type MockUserPreview = {
	user: UserInfo;
	projects: MockUserProject[];
};

/**
 * Create or update a mock user (sign-in)
 */
export const mockSignIn = async (data: MockSignInData): Promise<UserInfo> => {
	return request<UserInfo>('/auth/sign-in', {
		method: Method.POST,
		json: data
	});
};

/**
 * Check if a user exists by ID
 */
export const checkUserExists = async (id: number): Promise<{ exists: boolean; id: number }> => {
	return request<{ exists: boolean; id: number }>(`/mock/users/${id}/exists`, {
		method: Method.GET
	});
};

/**
 * Get user by ID
 */
export const getUserById = async (id: number): Promise<UserInfo> => {
	return request<UserInfo>(`/mock/users/${id}`, {
		method: Method.GET
	});
};

/**
 * Get full user preview with projects
 */
export const getUserPreview = async (id: number): Promise<MockUserPreview> => {
	return request<MockUserPreview>(`/mock/users/${id}/preview`, {
		method: Method.GET
	});
};

/**
 * Update user role in the database (mock mode only)
 */
export const updateUserRole = async (
	userId: number,
	role: 'admin' | 'director' | 'user'
): Promise<UserInfo> => {
	return request<UserInfo>(`/mock/users/${userId}/role`, {
		method: Method.PATCH,
		json: { role }
	});
};
