export type PublicationSource = 'doi' | 'manual' | 'arxiv' | 'nma' | 'isbn' | 'pubmed' | 'pub_openalex' | 'unknown';
export type ResearcherIdType = 'orcid' | 'res_openalex' | 'unknown';

export type Project = {
	projectId: number;
};

export type Publication = {
	id?: number;
	title: string;
	authors: string;
	journal: string;
	year: number;
	url: string;
	uniqueId?: string;
	source?: PublicationSource;
	status: 'pending' | 'approved' | 'rejected';
	reviewerNote?: string | null;

	createdAt?: EpochTimeStamp;
	// optional flag from backend indicating the current user is the owner
	isOwner?: boolean;
};
