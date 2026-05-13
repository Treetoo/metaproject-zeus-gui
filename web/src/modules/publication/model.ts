export type PublicationSource = 'doi' | 'manual' | 'arxiv' | 'nma' | 'isbn' | 'pubmed' | 'pub_openalex' | 'openalex' | 'unknown';
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
	// Only populated for credited publications tab
	creditStatus?: 'pending' | 'approved' | 'rejected';
};

export type Creditor = {
	userId: number;
	username: string;
	name: string;
	email: string;
	status: 'pending' | 'approved' | 'rejected';
};

export type Stakeholder = {
	userId: number;
	username: string;
	name: string;
	email: string;
	status?: 'pending' | 'approved' | 'rejected';
};

export type PublicationDetail = Publication & {
	project?: { id: number; title: string } | null;
	creditors?: Creditor[];
	stakeholders?: Stakeholder[];
	requestedBy?: number;
	ownerId?: number;
	ownerName?: string;
	ownerUsername?: string;
	ownerEmail?: string;
	reviewerId?: number;
	reviewedAt?: EpochTimeStamp;
	weight?: number;
	createdAt?: string;
	updatedAt?: string;
};
