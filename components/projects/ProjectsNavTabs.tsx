import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useProjectTabContext } from '@/context/ProjectTabContext';
import { FolderKanban, FileText } from 'lucide-react-native';

export default function ProjectsNavTabs() {
  const { activeTab, setActiveTab } = useProjectTabContext();

  const tabs = [
    {
      name: 'Manage Projects',
      tab: 'manage-projects' as const,
      icon: FolderKanban,
    },
    {
      name: 'Manage Contracts',
      tab: 'manage-contracts' as const,
      icon: FileText,
    },
  ];

  return (
    <View className="flex-row border-b border-white/10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.tab;

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={1}
            className={`flex-1 flex-row items-center justify-center border-b-2 px-2 py-3 ${
              active ? 'border-white' : 'border-transparent'
            }`}
            onPress={() => setActiveTab(tab.tab)}>
            <Icon color={active ? '#ffffff' : '#9ca3af'} size={18} />
            <Text
              className={`ml-1 text-sm font-semibold ${active ? 'text-white' : 'text-gray-400'}`}
              style={active ? { color: '#ffffff' } : { color: '#9ca3af' }}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

