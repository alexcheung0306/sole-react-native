import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Briefcase, FileText, Search } from 'lucide-react-native';

type JobTab = 'job-posts' | 'applied-roles' | 'my-contracts';

type JobsNavTabsProps = {
  activeTab: JobTab;
  setActiveTab: (tab: JobTab) => void;
};

export default function JobsNavTabs({ activeTab, setActiveTab }: JobsNavTabsProps) {

  const tabs = [
    {
      name: 'Job Posts',
      tab: 'job-posts' as const,
      icon: Search,
    },
    {
      name: 'Applied Roles',
      tab: 'applied-roles' as const,
      icon: Briefcase,
    },
    {
      name: 'My Contracts',
      tab: 'my-contracts' as const,
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
              active ? '  border-white' : 'border-transparent'
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
