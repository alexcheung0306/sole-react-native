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
    <View className="mb-5 flex-row rounded-2xl border border-white/10 bg-zinc-900/50 p-1">
      {tabs.map((tab) => {
        const active = projectStatus === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 rounded-xl px-4 py-2 ${active ? 'bg-white' : 'bg-transparent'}`}
            activeOpacity={0.85}
            onPress={() => handleTabPress(tab.id)}>
            <Text
              className={`text-center text-[10px] font-semibold ${active ? 'text-black' : 'text-white'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
