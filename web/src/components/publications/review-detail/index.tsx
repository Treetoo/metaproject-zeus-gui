import { useState } from 'react';
import { Modal, Stack, Text, Group, Button, NumberInput, Badge, Box, Divider, Anchor, Textarea } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

import { type ApprovalFormData, approvalSchema } from '@/modules/publication/approval-form';
import { type Publication } from '@/modules/publication/model';

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
	onApproved?: () => void;
	onRejected?: () => void;
	onApprove: ReviewAction;
	onReject: ReviewAction;
};

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
		<Modal opened={opened} onClose={onClose} title={`Review ${title}`} size="lg" centered>
			<Stack gap="md">
				<Box>
					<Text size="sm" c="dimmed" mb={4}>
						Title
					</Text>
					<Text fw={500} size="lg">
						{publication.title}
					</Text>
				</Box>

				<Box>
					<Text size="sm" c="dimmed" mb={4}>
						Link
					</Text>
					<Anchor href={publication.url} target="_blank" rel="noopener noreferrer" size="lg">
						{publication.url}
					</Anchor>
				</Box>

				<Group grow>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>
							Authors
						</Text>
						<Text>{publication.authors}</Text>
					</Box>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>
							Year
						</Text>
						<Text>{publication.year}</Text>
					</Box>
				</Group>

				<Group grow>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>
							Journal
						</Text>
						<Text>{publication.journal}</Text>
					</Box>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>
							DOI/Unique ID
						</Text>
						<Text>{publication.uniqueId}</Text>
					</Box>
				</Group>

				<Box>
					<Text size="sm" c="dimmed" mb={4}>
						{statusLabel}
					</Text>
					<Badge color="yellow" size="lg">
						{(publication as any).creditStatus || publication.status || 'pending'}
					</Badge>
				</Box>

				<Divider my="sm" />

				<form onSubmit={form.handleSubmit(handleApprove)}>
					<Stack gap="md">
						<NumberInput
							label="Weight"
							description="Assign a weight to this publication (optional)"
							min={0}
							max={100}
							value={form.watch('weight')}
							onChange={value => form.setValue('weight', value as number, { shouldValidate: true })}
							error={form.formState.errors.weight?.message}
						/>

						<Textarea
							rows={4}
							autosize
							maxRows={8}
							label="Reviewers note"
							description="Explains why the request was not approved"
							value={form.watch('reviewerNote')}
							onChange={event =>
								form.setValue('reviewerNote', event.currentTarget.value, { shouldValidate: true })
							}
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
