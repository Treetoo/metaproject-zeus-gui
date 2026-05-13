import { useState } from 'react';
import { Modal, Stack, Text, Group, Button, NumberInput, Badge, Box, Divider, Anchor, Textarea, SimpleGrid } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

import { type ApprovalFormData, approvalSchema } from '@/modules/publication/approval-form';
import { type Publication, type PublicationDetail, type Creditor, type Stakeholder } from '@/modules/publication/model';

type ReviewAction = (data: ApprovalFormData) => Promise<void>;

export type ReviewDetailProps = {
	opened: boolean;
	onClose: () => void;
	publication: Publication | null;
	title: string;
	statusLabel: string;
	successMessage: string;
	rejectMessage: string;
	failureMessage: string;
	queryKey: string[];
	showWeight?: boolean;
	showDetails?: boolean;
	onApproved?: () => void;
	onRejected?: () => void;
	onApprove: ReviewAction;
	onReject: ReviewAction;
};

const StatusBadge = ({ status }: { status: 'pending' | 'approved' | 'rejected' }) => {
	const colorMap = {
		pending: 'yellow',
		approved: 'green',
		rejected: 'red'
	};
	return <Badge color={colorMap[status]} size="sm">{status}</Badge>;
};

const InfoItem = ({ label, value, subValue }: { label: string; value: string | React.ReactNode; subValue?: string }) => (
	<Box>
		<Text size="xs" c="dimmed" mb={2}>{label}</Text>
		<Text size="sm" fw={500}>{value}</Text>
		{subValue && <Text size="xs" c="dimmed">{subValue}</Text>}
	</Box>
);

export const ReviewDetail = ({
	opened,
	onClose,
	publication,
	title,
	statusLabel,
	successMessage,
	rejectMessage,
	failureMessage,
	queryKey,
	showWeight = true,
	showDetails = false,
	onApproved,
	onRejected,
	onApprove,
	onReject
}: ReviewDetailProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<ApprovalFormData>({
		resolver: zodResolver(approvalSchema),
		defaultValues: { weight: 1, reviewerNote: publication?.reviewerNote ?? '' }
	});

	if (!publication) {
		return null;
	}

	const pubDetail = publication as PublicationDetail;

	const handleApprove = async (data: ApprovalFormData) => {
		if (!publication.id) return;

		setIsSubmitting(true);
		try {
			await onApprove({ ...data, publicationId: publication.id });

			notifications.show({
				message: successMessage,
				color: 'green'
			});

			await queryClient.invalidateQueries({ queryKey });
			onApproved?.();
			onClose();
			form.reset();
		} catch (error) {
			notifications.show({
				message: failureMessage,
				color: 'red'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		if (!publication.id) return;

		const data = form.getValues();
		setIsSubmitting(true);
		try {
			await onReject({ ...data, publicationId: publication.id });

			notifications.show({
				message: rejectMessage,
				color: 'orange'
			});

			await queryClient.invalidateQueries({ queryKey });
			onRejected?.();
			onClose();
		} catch (error) {
			notifications.show({
				message: failureMessage,
				color: 'red'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal opened={opened} onClose={onClose} title={`Review ${title}`} size="xl" centered>
			<Stack gap="md">
				{/* Essential Info - Project and Owner at the top */}
				{showDetails && (pubDetail.project || pubDetail.ownerId) && (
					<SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
						{pubDetail.project && <InfoItem label="Project" value={pubDetail.project.title} />}
						{pubDetail.ownerId && (
							<InfoItem
								label="Requested By (Owner)"
								value={pubDetail.ownerName || 'Unknown'}
								subValue={`@${pubDetail.ownerUsername || ''} | ${pubDetail.ownerEmail || ''}`}
							/>
						)}
					</SimpleGrid>
				)}

				<Divider my="sm" />

				{/* Main Publication Info - 2 columns */}
				<SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
					<InfoItem label="Title" value={publication.title} />
					<InfoItem
						label="Status"
						value={<Badge color="yellow" size="sm">{(publication as any).creditStatus || publication.status || 'pending'}</Badge>}
					/>
				</SimpleGrid>

				<Box>
					<Text size="xs" c="dimmed" mb={2}>Link</Text>
					<Anchor href={publication.url} target="_blank" rel="noopener noreferrer" size="sm">
						{publication.url}
					</Anchor>
				</Box>

				<SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
					<InfoItem label="Authors" value={publication.authors} />
					<InfoItem label="Year" value={String(publication.year)} />
				</SimpleGrid>

				<SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
					<InfoItem label="Journal" value={publication.journal} />
					<InfoItem label="DOI/Unique ID" value={publication.uniqueId} />
				</SimpleGrid>

				{/* Creditors and Stakeholders */}
				{showDetails && (pubDetail.creditors?.length || pubDetail.stakeholders?.length) && (
					<>
						<Divider my="sm" />

						<SimpleGrid cols={2} breakpoints={[{ maxWidth: 'md', cols: 1 }]}>
							{pubDetail.creditors && pubDetail.creditors.length > 0 && (
								<Box>
									<Text size="sm" fw={600} mb={6}>Creditors</Text>
									<Stack gap={4}>
										{pubDetail.creditors.map((creditor: Creditor) => (
											<Box key={creditor.userId} p={6} style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
												<Group justify="space-between" gap="xs">
													<div style={{ flex: 1 }}>
														<Text size="sm" fw={500}>{creditor.name}</Text>
														<Text size="xs" c="dimmed">@{creditor.username} | {creditor.email}</Text>
													</div>
													<StatusBadge status={creditor.status} />
												</Group>
											</Box>
										))}
									</Stack>
								</Box>
							)}

							{pubDetail.stakeholders && pubDetail.stakeholders.length > 0 && (
								<Box>
									<Text size="sm" fw={600} mb={6}>Stakeholders</Text>
									<Stack gap={4}>
										{pubDetail.stakeholders.map((stakeholder: Stakeholder) => (
											<Box key={stakeholder.userId} p={6} style={{ background: 'var(--mantine-color-gray-0)', borderRadius: 4 }}>
												<Group justify="space-between" gap="xs">
													<div style={{ flex: 1 }}>
														<Text size="sm" fw={500}>{stakeholder.name}</Text>
														<Text size="xs" c="dimmed">@{stakeholder.username} | {stakeholder.email}</Text>
													</div>
													{stakeholder.status ? <StatusBadge status={stakeholder.status} /> : null}
												</Group>
											</Box>
										))}
									</Stack>
								</Box>
							)}
						</SimpleGrid>
					</>
				)}

				<Divider my="sm" />

				<form onSubmit={form.handleSubmit(handleApprove)}>
					<Stack gap="md">
						{showWeight && (
							<NumberInput
								label="Weight"
								description="Assign a weight to this publication (optional)"
								min={0}
								max={100}
								value={form.watch('weight')}
								onChange={(value) => form.setValue('weight', value as number, { shouldValidate: true })}
								error={form.formState.errors.weight?.message}
							/>
						)}

						<Textarea
							rows={3}
							autosize
							maxRows={6}
							label="Reviewers note"
							description="Explains why the request was not approved"
							value={form.watch('reviewerNote')}
							onChange={(event) => form.setValue('reviewerNote', event.currentTarget.value, { shouldValidate: true })}
							error={form.formState.errors.reviewerNote?.message}
						/>
						<Group justify="flex-end" mt="md">
							<Button variant="default" onClick={onClose} disabled={isSubmitting}>
								Cancel
							</Button>

							<Button
								color="red"
								variant="light"
								onClick={handleReject}
								loading={isSubmitting}
								disabled={isSubmitting}
							>
								Reject
							</Button>

							<Button type="submit" color="green" loading={isSubmitting} disabled={isSubmitting}>
								Approve
							</Button>
						</Group>
					</Stack>
				</form>
			</Stack>
		</Modal>
	);
};
