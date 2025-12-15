import React from 'react';
import { Pencil, Plus } from 'lucide-react-native';
import { PrimaryButton } from '~/components/custom/primary-button';
import { router } from 'expo-router';

interface ProjectInfoFormModalProps {
  method: 'POST' | 'PUT';
  initValues?: any;
  triggerClassName?: string;
  renderTrigger?: (helpers: {
    open: () => void;
    close: () => void;
    isOpen: boolean;
  }) => React.ReactNode;
}

export interface ProjectFormValues {
  projectImage?: string | null;
  isPrivate: boolean;
  projectName: string;
  projectDescription: string;
  usage: string;
  remarks: string;
  status: string;
}

export default function ProjectInfoFormModal({
  method,
  initValues,
  triggerClassName,
  renderTrigger,
}: ProjectInfoFormModalProps) {
  const handleOpen = () => {
    const params: Record<string, string> = {
      formType: 'project',
      method,
    };

    if (initValues) {
      if (initValues.id) params.projectId = initValues.id;
      if (initValues.projectImage) params.projectImage = initValues.projectImage;
      if (initValues.isPrivate !== undefined) params.isPrivate = String(initValues.isPrivate);
      if (initValues.projectName) params.projectName = initValues.projectName;
      if (initValues.projectDescription) params.projectDescription = initValues.projectDescription;
      if (initValues.usage) params.usage = initValues.usage;
      if (initValues.remarks) params.remarks = initValues.remarks;
      if (initValues.status) params.status = initValues.status;
    }

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
    <PrimaryButton
      variant={method === 'POST' ? 'create' : 'edit'}
      disabled={false}
      icon={
        method === 'POST' ? (
          <Plus size={20} color="#000000" />
        ) : (
          <Pencil size={20} color="#000000" />
        )
      }
      onPress={handleOpen}>
      {method === 'POST' ? 'Create New Project' : 'Edit Project'}
    </PrimaryButton>
  );
}
