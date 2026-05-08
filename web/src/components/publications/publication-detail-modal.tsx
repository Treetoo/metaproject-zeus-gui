import { Modal, Stack, Text, Group, Button, Badge, Box, Divider, Anchor } from '@mantine/core';

import type { Publication } from '@/modules/publication/model';

type PublicationDetailModalProps = {
	opened: boolean;
	onClose: () => void;
	publication: Publication | null;
};

export const PublicationDetailModal = ({ opened, onClose, publication }: PublicationDetailModalProps) => {
	console.log(publication);
	if (!publication) {
		return null;
	}

	return (
		<Modal opened={opened} onClose={onClose} title="Publication Details" size="lg" centered>
			<Stack gap="md">
				<Box>
					<Text size="sm" c="dimmed" mb={4}>
						Title
					</Text>
					<Text fw={500} size="lg">
						{publication.title}
					</Text>
				</Box>

				{publication.url && (
					<Box>
						<Text size="sm" c="dimmed" mb={4}>
							Link
						</Text>
						<Anchor href={publication.url} target="_blank" rel="noopener noreferrer" size="lg">
							{publication.url}
						</Anchor>
					</Box>
				)}

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
					{publication.uniqueId && (
						<Box>
							<Text size="sm" c="dimmed" mb={4}>
								DOI/Unique ID
							</Text>
							<Text>{publication.uniqueId}</Text>
						</Box>
					)}
				</Group>

				<Box>
					<Text size="sm" c="dimmed" mb={4}>
						Status
					</Text>
					<Badge
						color={
							publication.status === 'approved'
								? 'green'
								: publication.status === 'rejected'
									? 'red'
									: 'orange'
						}
					>
						{publication.status}
					</Badge>
				</Box>

				{publication.reviewerNote && (
					<>
						<Divider my="sm" />
						<Box>
							<Text size="sm" c="dimmed" mb={4}>
								Reviewer&apos;s Note
							</Text>
							<Text size="sm">{publication.reviewerNote}</Text>
						</Box>
					</>
				)}

				<Group justify="flex-end" mt="md">
					<Button onClick={onClose}>Close</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
