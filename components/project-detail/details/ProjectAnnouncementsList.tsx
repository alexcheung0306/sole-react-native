import React, { useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Calendar, Megaphone, Users } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import {
  getProjectAnnouncementsByProjectId,
  getProjectAnnouncementsByProjectIdAndSenderId,
  getProjectAnnouncementsForUser,
} from '@/api/apiservice/project_announcement_api';
import PaginationControl from '~/components/projects/PaginationControl';

type ProjectAnnouncementsListProps = {
  projectId: number;
  senderId?: string | null;
  viewerId?: string | null;
  viewerRoleLevels?: { roleId: number; level: number }[];
};

export function ProjectAnnouncementsList({
  projectId,
  senderId,
  viewerId,
  viewerRoleLevels = [],
}: ProjectAnnouncementsListProps) {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const isViewerFiltered = Boolean(viewerId && viewerRoleLevels.length > 0);

  const queryKey = useMemo(
    () => [
      'project-announcements',
      projectId,
      senderId || 'all-senders',
      viewerId || 'no-viewer',
      isViewerFiltered ? viewerRoleLevels : 'no-roles',
      page,
      pageSize,
    ],
    [projectId, senderId, viewerId, isViewerFiltered, viewerRoleLevels, page, pageSize]
  );

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (isViewerFiltered) {
        return getProjectAnnouncementsForUser(projectId, viewerId as string, viewerRoleLevels, 'createdAt', 'desc', page, pageSize);
      }
      if (senderId) {
        return getProjectAnnouncementsByProjectIdAndSenderId(projectId, senderId, 'createdAt', 'desc', page, pageSize);
      }
      return getProjectAnnouncementsByProjectId(projectId, 'createdAt', 'desc', page, pageSize);
    },
    enabled: Boolean(projectId) && (!isViewerFiltered || Boolean(viewerId)),
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
      <View className="rounded-2xl border border-white/10 bg-zinc-700 p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-2">
            <Text className="text-lg font-semibold text-white">
              {item?.title ?? 'Untitled announcement'}
            </Text>
            <View className="flex-row flex-wrap items-center gap-4">
              <View className="flex-row items-center gap-1">
                <Calendar size={16} color="rgba(244,244,245,0.65)" />
                <Text className="text-[12px] text-white">{formattedDate}</Text>
              </View>
              {item?.senderName ? (
                <View className="flex-row items-center gap-1">
                  <Megaphone size={16} color="rgba(244,244,245,0.65)" />
                  <Text className="text-[12px] text-white">By {item.senderName}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1">
            <Text className="text-[12px] font-semibold text-white">#{item?.id ?? '—'}</Text>
          </View>
        </View>

        <Text className="mt-4 text-base leading-6 text-white whitespace-pre-wrap">
          {parsedContent}
        </Text>

        {receivers.length > 0 ? (
          <View className="mt-5 space-y-3 border-t border-white/10 pt-4">
            <View className="flex-row items-center gap-2">
              <Users size={16} color="rgba(250,250,250,0.85)" />
              <Text className="text-sm font-semibold text-white">Target Audience</Text>
            </View>
            {receivers.map((receiver, index) => (
              <View key={`${receiver.roleTitle}-${index}`} className="space-y-2">
                <Text className="text-sm font-semibold text-white">
                  {receiver.roleTitle}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {receiver.viewLevel === -1 ? (
                    <View className="rounded-full border border-emerald-400/60 bg-emerald-500/30 px-3 py-1">
                      <Text className="text-xs font-semibold text-white">Everyone</Text>
                    </View>
                  ) : receiver.processes.length > 0 ? (
                    receiver.processes.map((stage) => (
                      <View
                        key={stage}
                        className="rounded-full border border-blue-400/60 bg-blue-500/30 px-3 py-1">
                        <Text className="text-xs font-semibold text-white">{stage}</Text>
                      </View>
                    ))
                  ) : (
                    <View className="rounded-full border border-rose-400/60 bg-rose-500/30 px-3 py-1">
                      <Text className="text-xs font-semibold text-white">No access</Text>
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
    <View className="flex-row items-start justify-between">
      <View className="flex-1 gap-1">
        <Text className="text-xl font-semibold text-white">Project Announcements</Text>
        <Text className="text-sm text-white/80">
          Review the latest updates shared with your roles.
        </Text>
      </View>
      <View className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1">
        <Text className="text-xs font-semibold text-white">
          {totalCount} announcement{totalCount === 1 ? '' : 's'}
        </Text>
      </View>
    </View>
  );

  return (
    <View className=" gap-4 rounded-2xl border border-white/10 bg-zinc-800 p-5">
      {listHeader}

      <FlatList
        data={announcements}
        keyExtractor={(item) => `announcement-${item?.id}`}
        renderItem={renderAnnouncement}
        scrollEnabled={false}
        contentContainerStyle={{ gap: 12 }}
        ListEmptyComponent={() => (
          <View className="items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-10">
            <Text className="text-base font-semibold text-white">No announcements yet</Text>
            <Text className="max-w-[240px] text-center text-sm text-white/70">
              Announcements that you create will appear here for quick access.
            </Text>
          </View>
        )}
      />

      {totalPages > 1 && (
        <View className="mt-3">
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


