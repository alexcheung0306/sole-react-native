import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { FolderKanban, FileText } from 'lucide-react-native';

export default function ProjectsNavTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Manage Projects',
      href: '/(protected)/(client)/projects/manage-projects',
      icon: FolderKanban,
    },
    {
      name: 'Manage Contracts',
      href: '/(protected)/(client)/projects/manage-contracts',
      icon: FileText,
    },
  ];

  const isActive = (href: string) => {
    return pathname.includes(href.split('/').pop() || '');
  };

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
          const active = isActive(tab.href);

          return (
            <TouchableOpacity
              key={tab.name}
              className={`flex-row items-center gap-2 px-4 py-3 rounded-t-lg border-b-2 ${
                active
                  ? 'bg-white/10 border-white'
                  : 'border-transparent'
              }`}
              onPress={() => router.push(tab.href as any)}
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

