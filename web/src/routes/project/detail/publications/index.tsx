import { ActionIcon, Box, Button, Divider, Group, NumberInput, Stack, TextInput, Title } from '@mantine/core';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { IconClipboardPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { HTTPError } from 'ky';

import PageBreadcrumbs from '@/components/global/page-breadcrumbs';
import { useProjectOutletContext } from '@/modules/auth/guards/project-detail-guard';
import { type Publication } from '@/modules/publication/model';
import {
    manualPublicationSchema,
    type ManualPublicationSchema,
    searchByPubIdSchema as searchByPubIdSchema,
    type SearchByPubIdSchema as SearchByPubIdSchema
} from '@/modules/publication/form';
import { searchByPubId } from '@/modules/publication/api/search-by-publication-id';
import PublicationCard from '@/components/project/publications/publication-card';
import { useAddPublicationsMutation } from '@/modules/publication/mutations';
import { useAssignMyPublicationMutation, useMyPublicationsQuery } from '@/modules/publication/my-queries';
import { PUBLICATION_PAGE_SIZES } from '@/modules/publication/constants';
import { getSortQuery } from '@/modules/api/sorting/utils';

const isHttpError = (value: unknown): value is HTTPError => value instanceof HTTPError;

const ProjectPublicationsAddPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { project } = useProjectOutletContext();

    const [publications, setPublications] = useState<Publication[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchPubIdForm = useForm<SearchByPubIdSchema>({
        resolver: zodResolver(searchByPubIdSchema)
    });
    const addPublicationManuallyForm = useForm<ManualPublicationSchema>({
        resolver: zodResolver(manualPublicationSchema)
    });

    const { mutate, isPending } = useAddPublicationsMutation();
    const assignMutation = useAssignMyPublicationMutation();

    // state for "My publications" modal
    const [isMyModalOpen, setIsMyModalOpen] = useState(false);
    const [myPage, setMyPage] = useState(1);
    const [myLimit, setMyLimit] = useState(PUBLICATION_PAGE_SIZES[0]);
    const [mySort, setMySort] = useState<DataTableSortStatus<Publication>>({
        columnAccessor: 'id',
        direction: 'asc'
    });
    const mySortQuery = useMemo(
        () => getSortQuery(mySort.columnAccessor, mySort.direction),
        [mySort]
    );
    const {
        data: myResponse,
        isPending: isMyLoading,
        refetch: refetchMy
    } = useMyPublicationsQuery({ page: myPage, limit: myLimit }, mySortQuery);
    const myRecords = myResponse?.data ?? [];
    const myTotal = myResponse?.metadata?.totalRecords ?? 0;
    const [selectedMy, setSelectedMy] = useState<Publication[]>([]);

    const handleSelect = (pickedPublication: Publication) => {
        // publication is picked - remove
        if (publications.some((publication: Publication) => publication.uniqueId === pickedPublication.uniqueId)) {
            setPublications((publications: Publication[]) =>
                publications.filter((publication: Publication) => publication.uniqueId !== pickedPublication.uniqueId)
            );
        } else {
            setPublications((publications: Publication[]) => [...publications, pickedPublication]);
        }
    };

    const searchDoiSubmit = async (values: SearchByPubIdSchema) => {
        setIsSearching(true);
        const publication = await searchByDoi(values.doi);
        setIsSearching(false);

        if (!publication) {
            searchPubIdForm.setError('doi', {
                type: 'custom',
                message: 'Publication not found'
            });
            return;
        }

        searchPubIdForm.reset();
        handleSelect({
            ...publication,
            source: 'doi'
        });
    };

    const onManualAddSubmit = (values: ManualPublicationSchema) => {
        const publication: Publication = {
            title: values.title,
            year: +values.year,
            authors: values.authors,
            journal: values.journal,
            source: 'manual'
        };

        handleSelect(publication);
        addPublicationManuallyForm.reset();
        modals.closeAll();
    };

    const openManualPublicationAdd = () => {
        modals.open({
            title: t('routes.ProjectPublicationsAddPage.modal.title'),
            centered: true,
            size: 'xl',
            children: (
                <form onSubmit={addPublicationManuallyForm.handleSubmit(onManualAddSubmit)}>
                    <TextInput
                        label={t('routes.ProjectPublicationsAddPage.modal.form.title')}
                        {...addPublicationManuallyForm.register('title')}
                        error={addPublicationManuallyForm.formState.errors.title?.message}
                        withAsterisk
                        placeholder="Interaction effects in topological superconducting wires supporting Majorana fermions"
                    />
                    <TextInput
                        label={t('routes.ProjectPublicationsAddPage.modal.form.authors')}
                        withAsterisk
                        {...addPublicationManuallyForm.register('authors')}
                        error={addPublicationManuallyForm.formState.errors.authors?.message}
                        placeholder="E. M. Stoudenmire and Jason Alicea and Oleg A. Starykh and Matthew P.A. Fisher"
                    />
                    <Controller
                        control={addPublicationManuallyForm.control}
                        name="year"
                        render={({ field }) => (
                            <NumberInput
                                label={t('routes.ProjectPublicationsAddPage.modal.form.year')}
                                placeholder="2011"
                                name={field.name}
                                withAsterisk
                                min={0}
                                max={2200}
                                error={addPublicationManuallyForm.formState.errors.year?.message}
                                onChange={e => field.onChange(+e)}
                            />
                        )}
                    />
                    <TextInput
                        label={t('routes.ProjectPublicationsAddPage.modal.form.journal')}
                        placeholder="Physical Review B"
                        withAsterisk
                        {...addPublicationManuallyForm.register('journal')}
                        error={addPublicationManuallyForm.formState.errors.journal?.message}
                    />
                    <Group mt={15} justify="center">
                        <Button type="submit">{t('routes.ProjectPublicationsAddPage.modal.form.submit')}</Button>
                    </Group>
                </form>
            )
        });
    };

    const openAddFromMy = async () => {
        setIsMyModalOpen(true);
        await refetchMy();
    };

    const closeAddFromMy = () => {
        setIsMyModalOpen(false);
        setSelectedMy([]);
    };

    const assignSelectedFromMy = async () => {
        if (!selectedMy.length) return;
        const assignable = selectedMy.filter((publication: Publication): publication is Publication & { id: number } =>
            typeof publication.id === 'number'
        );
        if (!assignable.length) return;
        try {
            await Promise.all(
                assignable.map((publication: Publication & { id: number }) =>
                    assignMutation.mutateAsync({ id: publication.id, projectId: project.id })
                )
            );
            notifications.show({ message: t('routes.ProjectPublicationsAddPage.my.assign_success', { count: assignable.length }) });
            await refetchMy();
            await queryClient.invalidateQueries({ queryKey: ['project', project.id, 'publications'] });
            closeAddFromMy();
            navigate(`/project/${project.id}`);
        } catch (e) {
            if (isHttpError(e) && e.response.status === 404) {
                notifications.show({
                    message: t('routes.ProjectPublicationsAddPage.no_access', {
                        defaultValue: 'You do not have access to update publications in this project.'
                    }),
                    color: 'yellow'
                });
                return;
            }
            notifications.show({ message: t('routes.ProjectPublicationsAddPage.error.message'), color: 'red' });
        }
    };

    const addPublications = () => {
        mutate(
            {
                projectId: project.id,
                publications
            },
            {
                onSuccess: async () => {
                    notifications.show({
                        message: t('routes.ProjectPublicationsAddPage.success.message')
                    });
                    await queryClient.invalidateQueries({ queryKey: ['project', project.id, 'publications'] });
                    navigate(`/project/${project.id}`);
                },
                onError: (error: unknown) => {
                    if (isHttpError(error) && error.response.status === 404) {
                        notifications.show({
                            message: t('routes.ProjectPublicationsAddPage.no_access', {
                                defaultValue: 'You do not have access to update publications in this project.'
                            }),
                            color: 'yellow'
                        });
                        return;
                    }

                    notifications.show({
                        message: t('routes.ProjectPublicationsAddPage.error.message'),
                        color: 'red'
                    });
                }
            }
        );
    };

    return (
        <Box>
            <PageBreadcrumbs
                links={[
                    { title: 'Projects', href: '/project' },
                    { title: project.title, href: `/project/${project.id}` },
                    { title: t('routes.ProjectPublicationsAddPage.title'), href: `/project/${project.id}/publications` }
                ]}
            />
            <Title>{project.title}</Title>
            <Title order={3} mt={20}>
                {t('routes.ProjectPublicationsAddPage.title')}
            </Title>
            <Stack mt={20}>
                <form onSubmit={searchPubIdForm.handleSubmit(searchDoiSubmit)}>
                    <Stack>
                        <TextInput
                            label="DOI"
                            placeholder="Search by DOI"
                            error={searchPubIdForm.formState.errors.doi?.message}
                            {...searchPubIdForm.register('doi')}
                        />
                        <Button fullWidth type="submit" leftSection={<IconSearch />} loading={isSearching}>
                            {t('routes.ProjectPublicationsAddPage.search_by_doi')}
                        </Button>
                    </Stack>
                </form>
                <Divider label="or" />
                <Button
                    onClick={openManualPublicationAdd}
                    variant="outline"
                    color="teal"
                    leftSection={<IconClipboardPlus />}
                >
                    {t('routes.ProjectPublicationsAddPage.add_manually')}
                </Button>
                <Button onClick={openAddFromMy} variant="outline" color="blue">
                    {t('routes.ProjectPublicationsAddPage.add_from_my_publications')}
                </Button>
            </Stack>
            {publications.length > 0 && (
                <Box py={30}>
                    <Title order={4}>{t('routes.ProjectPublicationsAddPage.table.title')}</Title>
                    <DataTable
                        height={500}
                        withTableBorder
                        striped
                        records={publications}
                        columns={[
                            {
                                accessor: 'title',
                                title: t('components.project.publications.index.columns.publication_info'),
                                render: (publication: Publication) => (
                                    <PublicationCard publication={publication} />
                                )
                            },
                            {
                                accessor: 'year',
                                title: t('components.project.publications.index.columns.year'),
                                width: 150
                            },
                            {
                                accessor: 'actions',
                                title: '',
                                textAlign: 'center',
                                width: 120,
                                render: (userInfo: Publication) => (
                                    <Group gap={4} justify="space-between" wrap="nowrap">
                                        <ActionIcon
                                            size="sm"
                                            variant="subtle"
                                            color="red"
                                            onClick={() => handleSelect(userInfo)}
                                        >
                                            <IconTrash size={24} />
                                        </ActionIcon>
                                    </Group>
                                )
                            }
                        ]}
                    />
                    <Button onClick={addPublications} color="teal" fullWidth mt={10} loading={isPending}>
                        {publications.length === 1
                            ? t('routes.ProjectPublicationsAddPage.add_button_one', { count: 1, defaultValue: 'Add publication to project' })
                            : t('routes.ProjectPublicationsAddPage.add_button_other', { count: publications.length, defaultValue: 'Add publications to project' })}
                    </Button>
                </Box>
            )}

            {isMyModalOpen && (
                <Box py={30}>
                    <Title order={4}>{t('routes.ProjectPublicationsAddPage.my.title', { defaultValue: 'My publications' })}</Title>
                    <DataTable
                        height={500}
                        withTableBorder
                        fetching={isMyLoading}
                        records={myRecords}
                        totalRecords={myTotal}
                        page={myPage}
                        onPageChange={async p => {
                            setMyPage(p);
                            await refetchMy();
                        }}
                        recordsPerPage={myLimit}
                        recordsPerPageOptions={PUBLICATION_PAGE_SIZES}
                        onRecordsPerPageChange={async l => {
                            setMyLimit(l);
                            await refetchMy();
                        }}
                        selectedRecords={selectedMy}
                        onSelectedRecordsChange={setSelectedMy}
                        sortStatus={mySort}
                        onSortStatusChange={async s => {
                            setMySort(s as DataTableSortStatus<Publication>);
                            await refetchMy();
                        }}
                        columns={[
                            { accessor: 'title', title: t('components.project.publications.index.columns.publication_info') },
                            { accessor: 'year', title: t('components.project.publications.index.columns.year'), width: 150 }
                        ]}
                    />
                    <Group mt={10} justify="flex-end">
                        <Button variant="default" onClick={closeAddFromMy}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
                        <Button color="teal" onClick={assignSelectedFromMy} loading={assignMutation.isPending}>
                            {t('routes.ProjectPublicationsAddPage.my.assign_selected', { defaultValue: 'Assign selected' })}
                        </Button>
                    </Group>
                </Box>
            )}
        </Box>
    );
};

export default ProjectPublicationsAddPage;
