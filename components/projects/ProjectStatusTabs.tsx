import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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

  const handleTabPress = (statusId: string) => {
    setProjectStatus(statusId);
    setCurrentPage(0);
    setIsSearching(false);
    setSearchQuery('');
    setSearchValue('');
    setSearchBy('projectName');
  };

  return (
    <View className="mb-4 flex-row gap-2 rounded-lg border border-white ">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          className={`flex-1 rounded-lg border px-4  py-1 ${
            projectStatus === tab.id ? 'bg-white ' : 'border-white/10 '
          } items-center`}
          onPress={() => handleTabPress(tab.id)}>
          <Text
            className={`text-sm font-semibold ${
              projectStatus === tab.id ? 'text-black' : 'text-gray-400'
            }`}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
