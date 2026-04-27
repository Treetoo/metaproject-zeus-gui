export type Project = {
	projectId: number;
}

export type Publication = {
	id?: number;
	title: string;
	authors: string;
	journal: string;
	year: number;
	url: string;
	uniqueId?: string;
	project?: Project;
	source?: 'doi' | 'manual' | 'ark' | 'nma' | 'isbn' | 'issn' | 'handle';
	status: 'pending' | 'approved' | 'rejected';
	// optional flag from backend indicating the current user is the owner
	isOwner?: boolean;
};
