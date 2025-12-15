import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { PlusIcon } from 'lucide-react-native';
import { router } from 'expo-router';

interface ProjectAnnouncementFormPortalProps {
  projectId: number;
  soleUserId: string;
  projectStatus: string;
  triggerClassName?: string;
  renderTrigger?: (helpers: {
    open: () => void;
    close: () => void;
    isOpen: boolean;
  }) => React.ReactNode;
}

export default function ProjectAnnouncementFormPortal({
  projectId,
  soleUserId,
  projectStatus,
  triggerClassName,
  renderTrigger,
}: ProjectAnnouncementFormPortalProps) {
  const handleOpen = () => {
    const params: Record<string, string> = {
      formType: 'projectAnnouncement',
      projectId: String(projectId),
      soleUserId: soleUserId,
      projectStatus: projectStatus,
    };

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });
  };

  if (renderTrigger) {
    return (
      <>
        {renderTrigger({
          open: handleOpen,
          close: () => {},
          isOpen: false,
        })}
      </>
    );
  }

  return (
    <TouchableOpacity
      className={triggerClassName || 'flex-row items-center justify-center rounded-xl bg-white px-4 py-2.5 text-black'}
      activeOpacity={0.85}
      onPress={handleOpen}>
      <PlusIcon className="h-4 w-4" />
      <Text className="text-sm font-semibold">Create Project Announcement</Text>
    </TouchableOpacity>
  );
}
