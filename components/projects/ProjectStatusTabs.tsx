import React from 'react';
import { CustomTabs } from '@/components/custom/custom-tabs';
import { useManageProjectContext } from '@/context/ManageProjectContext';

export default function ProjectStatusTabs() {
  const {
    projectStatus,
    setProjectStatus,
    setCurrentPage,
    setIsSearching,
    setSearchQuery,
    setSearchValue,
    setSearchBy,
  } = useManageProjectContext();

  const tabs = [
    { id: 'Draft', label: 'Draft' },
    { id: 'Published', label: 'Published' },
    { id: 'InProgress', label: 'In Progress' },
  ];

  const handleTabChange = (statusId: string) => {
    setProjectStatus(statusId);
    setCurrentPage(0);
    setIsSearching(false);
    setSearchQuery('');
    setSearchValue('');
    setSearchBy('projectName');
  };

  return (
    <CustomTabs
      tabs={tabs}
      value={projectStatus}
      onValueChange={handleTabChange}
      containerClassName="flex-row rounded-2xl border border-white/10 bg-zinc-700 p-1"
    />
  );
}
