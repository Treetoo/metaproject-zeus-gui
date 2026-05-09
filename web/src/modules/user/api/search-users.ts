import { request } from '@/modules/api/request';
import type { UserInfo } from '../model';

type UserResponse = {
	users: UserInfo[];
};

export const searchUsers = async (query: string): Promise<UserInfo[]> => {
	const response = await request<UserResponse>(`/users?query=${encodeURIComponent(query)}`);
	return response.users;
};
