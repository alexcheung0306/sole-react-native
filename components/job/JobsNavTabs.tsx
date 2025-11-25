import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4 border-b border-white/10"
      contentContainerStyle={{ paddingBottom: 2 }}
    >
      <View className="flex-row gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.tab;

          return (
            <TouchableOpacity
              key={tab.name}
              className={`flex-row items-center gap-2 px-4 py-3 rounded-t-lg border-b-2 ${
                active
                  ? 'bg-white/10 border-white'
                  : 'border-transparent'
              }`}
              onPress={() => setActiveTab(tab.tab)}
            >
              <Icon color={active ? '#ffffff' : '#9ca3af'} size={18} />
              <Text
                className={`text-sm font-semibold ${
                  active ? 'text-white' : 'text-gray-400'
                }`}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

