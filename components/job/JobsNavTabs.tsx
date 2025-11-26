import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useJobTabContext } from '@/context/JobTabContext';
import { Briefcase, FileText, Search } from 'lucide-react-native';

export default function JobsNavTabs() {
  const { activeTab, setActiveTab } = useJobTabContext();

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
            activeOpacity={active ? 1 : 0.7}
            className={`flex-1 flex-row items-center justify-center px-2 py-3 border-b-2 ${
              active
                ? '  border-white'
                : 'border-transparent'
            }`}
            onPress={() => setActiveTab(tab.tab)}
          >
            <Icon color={active ? '#ffffff' : '#9ca3af'} size={18} />
            <Text
              className={`text-sm font-semibold ml-1 ${
                active ? 'text-white' : 'text-gray-400'
              }`}
              style={active ? { color: '#ffffff' } : { color: '#9ca3af' }}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

