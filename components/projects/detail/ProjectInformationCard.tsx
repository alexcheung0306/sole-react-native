import { useState } from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { EllipsisVertical } from 'lucide-react-native';

import { ProjectInfoActionsDrawer } from '@/components/projects/detail/ProjectInfoActionsDrawer';
import ProjectInfoFormModal from '@/components/projects/ProjectInfoFormModal';
import { formatDateTime } from '@/utils/time-converts';

type ProjectInformationCardProps = {
  project: any;
  soleUserId: string;
};

export function ProjectInformationCard({ project, soleUserId }: ProjectInformationCardProps) {
  const hasImage = project?.projectImage && project.projectImage !== 'default_image_url';
  const [openActions, setOpenActions] = useState(false);

  return (
    <View className="gap-4">
      <View className="overflow-hidden rounded-2xl border border-white/10">
        {hasImage ? (
          <ImageBackground
            source={{ uri: project.projectImage }}
            className="h-52 w-full"
            resizeMode="cover">
            <View className="h-full w-full bg-gradient-to-t from-black/80 via-black/40 to-black/10 p-4">
              <View className="mt-auto gap-2">
                <Text className="text-2xl font-bold text-white" numberOfLines={1}>
                  {project?.projectName || 'Project'}
                </Text>
                <Text className="text-sm text-white/80">Project Information</Text>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View className="h-40 w-full justify-end bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 p-4">
            <Text className="text-2xl font-bold text-white" numberOfLines={1}>
              {project?.projectName || 'Project'}
            </Text>
            <Text className="text-sm text-white/80">Project Information</Text>
          </View>
        )}
      </View>

      <View className="rounded-2xl border border-white/10 bg-zinc-950/90 p-5">
        <View className="mb-6 flex-row items-start justify-between">
          <View className="flex-1 gap-2">
            <Text className="text-lg font-semibold text-white">Project details</Text>
            <Text className="text-sm text-white/70">
              Review the latest project information and quick actions.
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
         
            <TouchableOpacity
              className="rounded-full bg-white px-2 py-1"
              activeOpacity={0.85}
              onPress={() => setOpenActions(true)}>
              <EllipsisVertical color="#0f172a" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="space-y-4">
          <InfoRow label="Description" value={project?.projectDescription ?? 'No description provided.'} multiline />
          <InfoRow label="Usage" value={project?.usage ?? '—'} multiline />
          <InfoRow label="Remarks" value={project?.remarks ?? '—'} multiline />
          <View className="flex-row flex-wrap gap-3">
            <View className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {project?.isPrivate ? 'Private Project' : 'Public Project'}
              </Text>
            </View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                Status: {project?.status ?? '—'}
              </Text>
            </View>
            {project?.status === 'Published' && project?.applicationDeadline ? (
              <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                <Text className="text-xs font-semibold text-white">
                  Deadline: {formatDateTime(project.applicationDeadline)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <ProjectInfoActionsDrawer
        open={openActions}
        onOpenChange={setOpenActions}
        project={project}
        soleUserId={soleUserId}
      />
    </View>
  );
}

function InfoRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value?: string | null;
  multiline?: boolean;
}) {
  const displayValue = value ?? '—';
  return (
    <View className="gap-1">
      <Text className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
        {label}
      </Text>
      <Text
        className={`text-base text-white ${multiline ? 'leading-6' : 'leading-5'} ${
          multiline ? 'whitespace-pre-wrap' : 'whitespace-nowrap'
        }`}
        numberOfLines={multiline ? undefined : 1}>
        {displayValue}
      </Text>
    </View>
  );
}


