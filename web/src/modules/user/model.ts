export type User = {
	readonly id: number;
	readonly source: string;
	readonly externalId: string;
	readonly username: string;
	readonly name: string;
	readonly orcid?: string;
};

export type UserInfo = {
	id: number;
	source: string;
	externalId: string;
	locale: string;
	name: string;
	email: string;
	username: string;
	role?: string;
	orcid?: string;
};
