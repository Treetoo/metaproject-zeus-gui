import { useState } from 'react';
import { Modal, Stack, Text, Group, Button, NumberInput, Badge, Box, Divider } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { request } from '@/modules/api/request';
import { Method } from '@/modules/api/model';
import type { Publication } from '@/modules/publication/model';

// Validation schema for approval
const approvalSchema = z.object({
	weight: z.number().min(0).max(100).optional()
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface PendingPublication extends Publication {
	status: 'pending' | 'approved' | 'rejected';
	projectId: number;
	projectName?: string;
}

interface PublicationApprovalDetailProps {
	opened: boolean;
	onClose: () => void;
	publication: PendingPublication | null;
	onApproved?: () => void;
	onRejected?: () => void;
}

export const PublicationApprovalDetail = ({
	opened,
	onClose,
	publication,
	onApproved,
	onRejected
}: PublicationApprovalDetailProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<ApprovalFormData>({
		resolver: zodResolver(approvalSchema),
		defaultValues: { weight: 1 }
	});

	if (!publication) { return null; }

	const handleApprove = async (data: ApprovalFormData) => {
		if (!publication.id) return;

		setIsSubmitting(true);
		try {
			// Call your API endpoint: POST /publications/approval/:id/approve
			const response = await request(`/publications/approval/${publication.id}/approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ weight: data.weight || 1 })
			});

			if (!response.ok) throw new Error('Failed to approve');

			notifications.show({
				message: 'Publication approved successfully',
				color: 'green'
			});

			// Invalidate queries
			await queryClient.invalidateQueries({ queryKey: ['publications', 'approval', 'pending'] });

			onApproved?.();
			onClose();
			form.reset();
		} catch (error) {
			notifications.show({
				message: 'Failed to approve publication',
				color: 'red'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleReject = async () => {
		if (!publication.id) return;

		setIsSubmitting(true);
		try {
			const response = await request(`/publications/approval/${publication.id}/reject`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			console.log(response);
			if (!response.ok) throw new Error('Failed to reject');

			notifications.show({
				message: 'Publication rejected',
				color: 'orange'
			});

			await queryClient.invalidateQueries({ queryKey: ['publications', 'approval', 'pending'] });

			onRejected?.();
			onClose();
		} catch (error) {
			notifications.show({
				message: 'Failed to reject publication',
				color: 'red'
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Review Publication"
			size="lg"
			centered
		>
			<Stack gap="md">
				{/* Publication Details Section */}
				<Box>
					<Text size="sm" c="dimmed" mb={4}>Title</Text>
					<Text fw={500} size="lg">{publication.title}</Text>
				</Box>

				<Group grow>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>Authors</Text>
						<Text>{publication.authors}</Text>
					</Box>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>Year</Text>
						<Text>{publication.year}</Text>
					</Box>
				</Group>

				<Group grow>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>Journal</Text>
						<Text>{publication.journal}</Text>
					</Box>
					<Box>
						<Text size="sm" c="dimmed" mb={4}>DOI/Unique ID</Text>
						<Text>{publication.uniqueId}</Text>
					</Box>
				</Group>

				<Box>
					<Text size="sm" c="dimmed" mb={4}>Project</Text>
					<Badge size="lg" variant="light">
						Project ID: {publication.projectId}
						{publication.projectName && ` - ${publication.projectName}`}
					</Badge>
				</Box>

				<Box>
					<Text size="sm" c="dimmed" mb={4}>Status</Text>
					<Badge color="yellow" size="lg">{publication.status}</Badge>
				</Box>

				<Divider my="sm" />

				{/* Approval Form */}
				<form onSubmit={form.handleSubmit(handleApprove)}>
					<Stack gap="md">
						<NumberInput
							label="Weight"
							description="Assign a weight to this publication (optional)"
							min={0}
							max={100}
							value={form.watch('weight')}
							onChange={(value) => form.setValue('weight', value, { shouldValidate: true })}
							error={form.formState.errors.weight?.message}
						/>
						<Group justify="flex-end" mt="md">
							<Button
								variant="default"
								onClick={onClose}
								disabled={isSubmitting}
							>
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

							<Button
								type="submit"
								color="green"
								loading={isSubmitting}
								disabled={isSubmitting}
							>
								Approve
							</Button>
						</Group>
					</Stack>
				</form>
			</Stack>
		</Modal>
	);
};
