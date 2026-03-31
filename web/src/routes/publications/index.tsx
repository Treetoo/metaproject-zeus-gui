import { Box, Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconLibrary } from '@tabler/icons-react';
import { HTTPError } from 'ky';
import { searchByOrcid, type OrcidWorkDto } from '@/modules/publication/api/search-by-orcid';

import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import { getSortQuery } from '@/modules/api/sorting/utils';
import { useAssignMyPublicationMutation, useDeleteMyPublicationMutation, useMyPublicationsQuery } from '@/modules/publication/my-queries';
import { createMyPublication } from '@/modules/publication/api/my-publications';
import {
    manualPublicationSchema,
    searchByDoiSchema,
    searchByOrcidSchema,
    type ManualPublicationSchema,
    type SearchByDoiSchema,
    type SearchByOrcidSchema,
} from '@/modules/publication/form';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Publication } from '@/modules/publication/model';
import { searchByDoi } from '@/modules/publication/api/search-by-doi';
import { useMyActiveProjectsQuery } from '@/modules/project/queries';

const MyPublicationsPage = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
    const [sort, setSort] = useState<DataTableSortStatus<Publication>>({ columnAccessor: 'id', direction: 'asc' });
    const sortQuery = useMemo(() => getSortQuery(sort.columnAccessor, sort.direction), [sort]);

    const { data, isPending, refetch } = useMyPublicationsQuery({ page, limit }, sortQuery);
    // Fetch all active projects for dropdown selection
    const { data: myProjects, isPending: isProjectsPending } = useMyActiveProjectsQuery();
    const assignMutation = useAssignMyPublicationMutation();
    const deleteMutation = useDeleteMyPublicationMutation();
    const queryClient = useQueryClient();
    const [assignProjectId, setAssignProjectId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddDoiModalOpen, setIsAddDoiModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAddOrcidModalOpen, setIsAddOrcidModalOpen] = useState(false);
    const [publicationToAssign, setPublicationToAssign] = useState<Publication | null>(null);
    const [isOrcidSearching, setIsOrcidSearching] = useState(false);
    const [isOrcidSubmitting, setIsOrcidSubmitting] = useState(false);
    const [orcidInput, setOrcidInput] = useState('');
    const [orcidWorks, setOrcidWorks] = useState<OrcidWorkDto[]>([]);
    const addForm = useForm<ManualPublicationSchema>({ resolver: zodResolver(manualPublicationSchema) });
    const doiForm = useForm<SearchByDoiSchema>({ resolver: zodResolver(searchByDoiSchema), defaultValues: { doi: '' } });
    const orcidForm = useForm<SearchByOrcidSchema>({ resolver: zodResolver(searchByOrcidSchema), defaultValues: { doi: '' } });
    const [isDoiSubmitting, setIsDoiSubmitting] = useState(false);
    const isHttpError = (value: unknown): value is HTTPError => value instanceof HTTPError;
    const [selectedOrcidWorks, setSelectedOrcidWorks] = useState<OrcidWorkDto[]>([]);

    // Transform projects for Select dropdown
    const projectOptions = useMemo(() => {
        if (!myProjects || !Array.isArray(myProjects)) return [];
        return myProjects.map(project => ({
            value: String(project.id),
            label: project.title
        }));
    }, [myProjects]);

    const openAddDoiModal = () => {
        doiForm.reset({ doi: '' });
        setIsAddDoiModalOpen(true);
    };

    const closeAddDoiModal = () => {
        setIsAddDoiModalOpen(false);
        orcidForm.reset({ doi: '' });
    };

    const openAddOrcidModal = () => {
        setIsAddOrcidModalOpen(true);
        setOrcidInput('');
        setOrcidWorks([]);
        setSelectedOrcidWorks([]);
    };

    const closeAddOrcidModal = () => {
        setIsAddOrcidModalOpen(false);
    };

    const handleSearchOrcid = async () => {
        const trimmed = orcidInput.trim();
        if (!trimmed) {
            notifications.show({ message: 'Please enter an ORCID', color: 'yellow' });
            return;
        }

        setIsOrcidSearching(true);
        try {
            const result = await searchByOrcid(trimmed);
            setOrcidWorks(result.works || []);
            if (!result.works || result.works.length === 0) {
                notifications.show({ message: 'No publications found for this ORCID', color: 'blue' });
            }
        } catch (error) {
            notifications.show({ message: 'Failed to search by ORCID', color: 'red' });
        } finally {
            setIsOrcidSearching(false);
        }
    };

    const handleSubmitSelectedOrcid = async () => {
        if (selectedOrcidWorks.length === 0) return;

        const worksWithDoi = selectedOrcidWorks.filter(w => w.doi);
        if (worksWithDoi.length === 0) {
            notifications.show({ message: 'Selected publications have no DOI', color: 'yellow' });
            return;
        }

        if (worksWithDoi.length < selectedOrcidWorks.length) {
            notifications.show({
                message: `${selectedOrcidWorks.length - worksWithDoi.length} publication(s) skipped (no DOI)`,
                color: 'yellow'
            });
        }

        setIsOrcidSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        for (const work of worksWithDoi) {
            try {
                // Fetch full details by DOI to get journal information
                const publication = await searchByDoi(work.doi);
                if (publication) {
                    await createMyPublication({
                        ...publication,
                        source: 'doi',
                        uniqueId: work.doi
                    });
                    successCount++;
                } else {
                    // Fallback: create with available data if DOI lookup fails
                    await createMyPublication({
                        title: work.title,
                        authors: work.authors || '',
                        year: work.year || new Date().getFullYear(),
                        journal: 'Unknown',
                        source: 'doi',
                        uniqueId: work.doi
                    });
                    successCount++;
                }
            } catch (e) {
                errorCount++;
            }
        }

        if (successCount > 0) {
            notifications.show({
                message: `Added ${successCount} publication(s) from ORCID`,
                color: 'green'
            });
            await refetch();
            closeAddOrcidModal();
        }
        if (errorCount > 0) {
            notifications.show({
                message: `Failed to add ${errorCount} publication(s)`,
                color: 'red'
            });
        }
        setIsOrcidSubmitting(false);
    };

    const handleAddDoiSubmit = doiForm.handleSubmit(async ({ doi }: SearchByDoiSchema) => {
        const trimmed = doi.trim();

        if (!trimmed) {
            doiForm.setError('doi', { type: 'custom', message: 'DOI is required' });
            return;
        }

        setIsDoiSubmitting(true);
        try {
            const publication = await searchByDoi(trimmed);

            if (!publication) {
                doiForm.setError('doi', { type: 'custom', message: 'Publication not found' });
                setIsDoiSubmitting(false);
                return;
            }

            await createMyPublication({
                source: 'doi',
                uniqueId: publication.uniqueId ?? trimmed,
                title: publication.title,
                authors: publication.authors,
                year: publication.year,
                journal: publication.journal
            });

            notifications.show({ message: 'Publication added by DOI' });
            closeAddDoiModal();
            await refetch();
        } catch (error) {
            notifications.show({ message: 'Error', color: 'red' });
        } finally {
            setIsDoiSubmitting(false);
        }
    });

    const openAddModal = () => {
        addForm.reset();
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        addForm.reset();
    };

    const handleAddManualSubmit = addForm.handleSubmit(async (values: ManualPublicationSchema) => {
        try {
            await createMyPublication({ ...values, source: 'manual' });
            notifications.show({ message: 'Publication added' });
            closeAddModal();
            await refetch();
        } catch (error) {
            notifications.show({ message: 'Error', color: 'red' });
        }
    });

    const openAssignModal = (pub: Publication) => {
        if (!pub.id) return;
        setPublicationToAssign(pub);
        setAssignProjectId(null);
        setIsAssignModalOpen(true);
    };

    const closeAssignModal = () => {
        setIsAssignModalOpen(false);
        setPublicationToAssign(null);
        setAssignProjectId(null);
    };

    const handleAssignSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!assignProjectId || !publicationToAssign?.id) {
            return;
        }

        try {
            const projectIdNum = Number(assignProjectId);
            await assignMutation.mutateAsync({ id: publicationToAssign.id, projectId: projectIdNum });
            notifications.show({ message: 'Publication assigned to project successfully' });
            closeAssignModal();
            await queryClient.invalidateQueries({ queryKey: ['project', projectIdNum, 'publications'] });
            await refetch();
        } catch (error: unknown) {
            if (isHttpError(error) && error.response.status === 404) {
                notifications.show({ message: 'You do not have permission to add publications to that project.', color: 'yellow' });
                return;
            }
            if (isHttpError(error) && error.response.status === 403) {
                notifications.show({ message: 'You do not have permission to add publications to that project.', color: 'yellow' });
                return;
            }

            notifications.show({ message: 'Failed to assign publication. Please try again.', color: 'red' });
        }
    };

    const deletePublication = (pub: Publication) => {
        if (!pub.id) return;
        modals.openConfirmModal({
            title: 'Delete publication?',
            children: 'This will permanently delete the publication and unassign it from any project.',
            confirmProps: { color: 'red' },
            labels: { confirm: 'Delete', cancel: 'Cancel' },
            onConfirm: () => {
                deleteMutation.mutate(pub.id!, {
                    onSuccess: async () => {
                        notifications.show({ message: 'Publication deleted' });
                        await refetch();
                    },
                    onError: () => notifications.show({ message: 'Error', color: 'red' })
                });
            }
        });
    };

    return (
        <Box>
            <Modal opened={isAddModalOpen} onClose={closeAddModal} title="Add publication" centered size="xl">
                <form onSubmit={handleAddManualSubmit}>
                    <TextInput label="Title" {...addForm.register('title')} error={addForm.formState.errors.title?.message} withAsterisk />
                    <TextInput label="Authors" {...addForm.register('authors')} error={addForm.formState.errors.authors?.message} withAsterisk />
                    <Controller
                        control={addForm.control}
                        name="year"
                        render={({ field }: { field: { value: number | undefined; onChange: (value: number | string | null) => void } }) => (
                            <NumberInput
                                label="Year"
                                min={0}
                                max={2200}
                                value={field.value}
                                onChange={(value: string | number) => field.onChange(typeof value === 'number' ? value : null)}
                                error={addForm.formState.errors.year?.message}
                                withAsterisk
                            />
                        )}
                    />
                    <TextInput label="Journal" {...addForm.register('journal')} error={addForm.formState.errors.journal?.message} withAsterisk />
                    <Group mt={15} justify="flex-end">
                        <Button variant="default" type="button" onClick={closeAddModal}>Cancel</Button>
                        <Button type="submit" loading={addForm.formState.isSubmitting}>Add publication</Button>
                    </Group>
                </form>
            </Modal>


            <Modal opened={isAddDoiModalOpen} onClose={closeAddDoiModal} title="Add publication by DOI" centered size="md">
                <form onSubmit={handleAddDoiSubmit}>
                    <TextInput
                        label="DOI"
                        placeholder="10.1234/example.doi"
                        {...doiForm.register('doi')}
                        error={doiForm.formState.errors.doi?.message}
                        required
                    />
                    <Group mt={15} justify="flex-end">
                        <Button variant="default" type="button" onClick={closeAddDoiModal}>Cancel</Button>
                        <Button type="submit" loading={isDoiSubmitting}>Add by DOI</Button>
                    </Group>
                </form>
            </Modal>


            <Modal opened={isAddOrcidModalOpen} onClose={closeAddOrcidModal} title="Add publications by ORCID" centered size="xxl">
                <Stack>
                    <Group align="flex-end">
                        <TextInput
                            label="ORCID"
                            placeholder="0000-0002-8529-9990"
                            value={orcidInput}
                            onChange={(e) => setOrcidInput(e.currentTarget.value)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            onClick={handleSearchOrcid}
                            loading={isOrcidSearching}
                            disabled={!orcidInput.trim()}
                        >
                            Search
                        </Button>
                    </Group>

                    {orcidWorks.length > 0 && (
                        <>
                            <Text size="sm" c="dimmed">
                                Found {orcidWorks.length} publication(s). Select the ones you want to add:
                            </Text>
                            <DataTable
                                height={400}
                                withTableBorder
                                records={orcidWorks}
                                selectedRecords={selectedOrcidWorks}
                                onSelectedRecordsChange={setSelectedOrcidWorks}
                                idAccessor='doi'
                                columns={[
                                    { accessor: 'title', title: 'Title', width: 300 },
                                    { accessor: 'authors', title: 'Authors', width: 300 },
                                    { accessor: 'year', title: 'Year', width: 100 },
                                    { accessor: 'doi', title: 'DOI', width: 300 }
                                ]}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="default" onClick={closeAddOrcidModal}>Cancel</Button>
                                <Button
                                    color="teal"
                                    onClick={handleSubmitSelectedOrcid}
                                    loading={isOrcidSubmitting}
                                    disabled={selectedOrcidWorks.length === 0}
                                >
                                    Add {selectedOrcidWorks.length} selected
                                </Button>
                            </Group>
                        </>
                    )}
                </Stack>
            </Modal>


            <Modal opened={isAssignModalOpen} onClose={closeAssignModal} title="Assign publication to project" centered>
                <form onSubmit={handleAssignSubmit}>
                    <Stack>
                        {!isProjectsPending && projectOptions.length === 0 ? (
                            <Text c="dimmed" size="sm">
                                You don't have any active projects to assign publications to.
                                Please create a project first or wait for your project request to be approved.
                            </Text>
                        ) : (
                            <Select
                                label="Select project"
                                placeholder={isProjectsPending ? "Loading projects..." : "Choose a project"}
                                data={projectOptions}
                                value={assignProjectId}
                                onChange={setAssignProjectId}
                                disabled={assignMutation.isPending || isProjectsPending}
                                searchable
                                nothingFoundMessage="No projects found"
                                description="Only active projects you are a member of are shown"
                            />
                        )}
                        <Group justify="flex-end">
                            <Button variant="default" type="button" onClick={closeAssignModal}>Cancel</Button>
                            <Button
                                type="submit"
                                loading={assignMutation.isPending}
                                disabled={!assignProjectId || projectOptions.length === 0}
                            >
                                Assign
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            <PageBreadcrumbs links={[{ title: 'Publications', href: '/publications' }]} />
            <Title order={3}><IconLibrary /> My publications</Title>
            <Group mt={10} mb={20}>
                <Button color="teal" onClick={openAddModal}>Add publication manually</Button>
                <Button color="blue" onClick={openAddDoiModal}>Add by DOI</Button>
                <Button color="blue" onClick={openAddOrcidModal}>Add by ORCID</Button>
            </Group>
            <DataTable
                height={500}
                withTableBorder
                fetching={isPending}
                records={data?.data ?? []}
                totalRecords={data?.metadata?.totalRecords}
                page={page}
                onPageChange={async (p: number) => { setPage(p); await refetch(); }}
                recordsPerPage={limit}
                recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
                onRecordsPerPageChange={async (l: number) => { setLimit(l); await refetch(); }}
                sortStatus={sort}
                onSortStatusChange={async (s: DataTableSortStatus<Publication>) => { setSort(s); await refetch(); }}
                columns={[
                    { accessor: 'title', title: 'Title' },
                    { accessor: 'authors', title: 'Authors' },
                    { accessor: 'journal', title: 'Journal' },
                    { accessor: 'year', title: 'Year', width: 120 },
                    {
                        accessor: 'actions', title: '', width: 220, textAlign: 'right',
                        render: (pub: Publication) => (
                            <Group gap={8} justify="flex-end">
                                <Button size="xs" variant="light" onClick={() => openAssignModal(pub)}>Assign to project</Button>
                                <Button size="xs" color="red" variant="light" onClick={() => deletePublication(pub)}>Delete</Button>
                            </Group>
                        )
                    }
                ]}
            />
        </Box>
    );
};

export default MyPublicationsPage;
