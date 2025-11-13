import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Calendar, Megaphone, Users } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { getProjectAnnouncementsByProjectId } from '@/api/apiservice/project_announcement_api';
import PaginationControl from '~/components/projects/PaginationControl';

type ProjectAnnouncementsListProps = {
  projectId: number;
};

export function ProjectAnnouncementsList({ projectId }: ProjectAnnouncementsListProps) {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const queryKey = useMemo(() => ['project-announcements', projectId, page, pageSize], [
    projectId,
    page,
    pageSize,
  ]);

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () => getProjectAnnouncementsByProjectId(projectId, 'createdAt', 'desc', page, pageSize),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });

  const totalCount = data?.total ?? 0;
  const announcements = data?.content ?? data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const renderAnnouncement = ({ item }: { item: any }) => {
    const parsedContent = parseEditorContent(item?.content ?? '');
    const receivers = parseReceivers(item?.receivers ?? []);
    const formattedDate = item?.createdAt
      ? new Date(item.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    return (
      <View style={styles.announcementCard}>
        <View style={styles.announcementHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.announcementTitle}>{item?.title ?? 'Untitled announcement'}</Text>
            <View style={styles.announcementMetaRow}>
              <View style={styles.metaItem}>
                <Calendar size={16} color="rgba(229,231,235,0.6)" />
                <Text style={styles.announcementMetaText}>{formattedDate}</Text>
              </View>
              {item?.senderName ? (
                <View style={styles.metaItem}>
                  <Megaphone size={16} color="rgba(229,231,235,0.6)" />
                  <Text style={styles.announcementMetaText}>By {item.senderName}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>#{item?.id ?? '—'}</Text>
          </View>
        </View>

        <Text style={styles.announcementContent}>{parsedContent}</Text>

        {receivers.length > 0 ? (
          <View style={styles.audienceContainer}>
            <View style={styles.audienceHeader}>
              <Users size={16} color="rgba(148,163,184,0.9)" />
              <Text style={styles.audienceTitle}>Target Audience</Text>
            </View>
            {receivers.map((receiver, index) => (
              <View key={`${receiver.roleTitle}-${index}`} style={styles.receiverRow}>
                <Text style={styles.receiverRole}>{receiver.roleTitle}</Text>
                <View style={styles.receiverChips}>
                  {receiver.viewLevel === -1 ? (
                    <View style={[styles.chip, styles.chipEveryone]}>
                      <Text style={styles.chipText}>Everyone</Text>
                    </View>
                  ) : receiver.processes.length > 0 ? (
                    receiver.processes.map((stage) => (
                      <View key={stage} style={[styles.chip, styles.chipStage]}>
                        <Text style={[styles.chipText, styles.chipTextStage]}>{stage}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={[styles.chip, styles.chipNone]}>
                      <Text style={styles.chipTextNone}>No access</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const listHeader = (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>Project Announcements</Text>
        <Text style={styles.sectionSubtitle}>Review the latest updates shared with your roles.</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countBadgeText}>
          {totalCount} announcement{totalCount === 1 ? '' : 's'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.sectionCard}>
      {listHeader}

      <FlatList
        data={announcements}
        keyExtractor={(item) => `announcement-${item?.id}`}
        renderItem={renderAnnouncement}
        scrollEnabled={false}
        contentContainerStyle={{ gap: 12 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No announcements yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Announcements that you create will appear here for quick access.
            </Text>
          </View>
        )}
      />

      {totalPages > 1 && (
        <View style={{ marginTop: 12 }}>
          <PaginationControl
            currentPage={page}
            setCurrentPage={setPage}
            totalPages={totalPages}
            isLoadingProjects={isLoading || isFetching}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: 24,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
  },
  sectionSubtitle: {
    color: 'rgba(229, 231, 235, 0.7)',
    fontSize: 14,
  },
  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.4)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countBadgeText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
  },
  announcementCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  announcementTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  announcementContent: {
    color: '#e5e7eb',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  announcementMetaText: {
    color: 'rgba(229, 231, 235, 0.6)',
    fontSize: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  badgeText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '600',
  },
  audienceContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.15)',
    paddingTop: 12,
    gap: 12,
  },
  audienceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audienceTitle: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  receiverRow: {
    gap: 6,
  },
  receiverRole: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
  receiverChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextStage: {
    color: '#bfdbfe',
  },
  chipEveryone: {
    borderColor: 'rgba(34,197,94,0.4)',
    backgroundColor: 'rgba(34,197,94,0.15)',
  },
  chipStage: {
    borderColor: 'rgba(59,130,246,0.4)',
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  chipNone: {
    borderColor: 'rgba(248,113,113,0.4)',
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  chipTextNone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fca5a5',
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtitle: {
    color: 'rgba(148, 163, 184, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

type ParsedReceiver = {
  roleTitle: string;
  viewLevel: number;
  processes: string[];
};

function parseEditorContent(rawContent: string): string {
  try {
    const parsed = JSON.parse(rawContent);
    if (!parsed?.blocks || !Array.isArray(parsed.blocks)) {
      return rawContent;
    }

    return parsed.blocks
      .map((block: any) => {
        const text = block?.data?.text ?? '';
        if (!text) {
          return null;
        }

        const normalized = text
          .replace(/&nbsp;/g, ' ')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        if (block.type === 'header') {
          return `\n${normalized}\n`;
        }

        return normalized;
      })
      .filter(Boolean)
      .join('\n\n');
  } catch (error) {
    return rawContent;
  }
}

function parseReceivers(receivers: any[]): ParsedReceiver[] {
  if (!Array.isArray(receivers)) {
    return [];
  }

  const standardStages = ['invited', 'applied', 'shortlisted', 'offered'];

  return receivers.map((receiver) => {
    const viewLevel = receiver?.viewLevel ?? 0;
    const processes = getProcessesForLevel(viewLevel, standardStages);
    return {
      roleTitle: receiver?.roleTitle ?? 'Unknown role',
      viewLevel,
      processes,
    };
  });
}

function getProcessesForLevel(viewLevel: number, stages: string[]): string[] {
  if (viewLevel === -1) {
    return stages.map(capitalize);
  }
  if (viewLevel <= 0) {
    return [];
  }

  const index = Math.max(0, viewLevel - 1);
  return stages.slice(index).map(capitalize);
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}


