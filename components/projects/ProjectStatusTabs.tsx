import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import { useSoleUserContext } from '@/context/SoleUserContext';

export default function ProjectStatusTabs() {
  const { soleUserId } = useSoleUserContext();
  const { projectStatus, setProjectStatus, setCurrentPage, setSearchAPI, setIsSearching, setSearchQuery } =
    useManageProjectContext();

  const tabs = [
    { id: 'Draft', label: 'Draft' },
    { id: 'Published', label: 'Published' },
    { id: 'InProgress', label: 'In Progress' },
  ];

  const handleTabPress = (statusId: string) => {
    setProjectStatus(statusId);
    setCurrentPage(0);
    setSearchAPI(
      `?status=${statusId}&pageNo=0&pageSize=10&orderBy=id&orderSeq=desc`
    );
    setIsSearching(false);
    setSearchQuery('');
  };

  return (
    <View className="flex-row gap-2 mb-4">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          className={`flex-1 py-1 px-4 rounded-lg bg-gray-800/60 border ${
            projectStatus === tab.id
              ? 'bg-white/20 border-white'
              : 'border-white/10'
          } items-center`}
          onPress={() => handleTabPress(tab.id)}
        >
          <Text
            className={`text-sm font-semibold ${
              projectStatus === tab.id ? 'text-white' : 'text-gray-400'
            }`}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
