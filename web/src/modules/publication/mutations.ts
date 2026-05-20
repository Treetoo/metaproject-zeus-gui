import { useMutation } from '@tanstack/react-query';

import { addPublications } from '@/modules/publication/api/add-publications';

export const useAddPublicationsMutation = () =>
	useMutation({
		mutationFn: addPublications
	});
