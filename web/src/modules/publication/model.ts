export type Publication = {
    id?: number;
    title: string;
    authors: string;
    journal: string;
    year: number;
    uniqueId?: string;
    source?: 'doi' | 'manual' | 'ark' | 'nma' | 'isbn' | 'issn' | 'handle';
    // optional flag from backend indicating the current user is the owner
    isOwner?: boolean;
};
