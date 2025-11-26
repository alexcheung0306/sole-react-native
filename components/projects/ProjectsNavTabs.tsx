import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    <View className="flex-row border-b border-white/10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={1}
            className={`flex-1 flex-row items-center justify-center px-2 py-3 border-b-2 ${
              active
                ? 'border-white'
                : 'border-transparent'
            }`}
            onPress={() => router.push(tab.href as any)}
          >
            <Icon color={active ? '#ffffff' : '#9ca3af'} size={12} />
            <Text
              className={`text-xs font-semibold ml-1 ${
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

