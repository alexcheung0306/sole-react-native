import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: string | number;
}

interface CustomTabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  containerClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  textClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  showCount?: boolean;
}

export function CustomTabs({
  tabs,
  value,
  onValueChange,
  containerClassName,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  textClassName,
  activeTextClassName,
  inactiveTextClassName,
  showCount = false,
}: CustomTabsProps) {
  const defaultContainerClassName =
    containerClassName || 'flex-row rounded-2xl border border-white/10 bg-zinc-700 p-1';
  const defaultTabClassName = tabClassName || 'flex-1 rounded-xl px-4 py-2';
  const defaultActiveTabClassName = activeTabClassName || 'bg-white';
  const defaultInactiveTabClassName = inactiveTabClassName || 'bg-transparent';
  const defaultTextClassName = textClassName || 'text-center text-[10px] font-semibold';
  const defaultActiveTextClassName = activeTextClassName || 'text-black';
  const defaultInactiveTextClassName = inactiveTextClassName || 'text-white';

  const getTabLabel = (tab: TabItem) => {
    // If showCount is enabled and count exists (including 0)
    if (showCount && tab.count !== undefined && tab.count !== null) {
      return `${tab.label} (${tab.count})`;
    }
    // If badge is explicitly provided (including empty string or 0)
    if (tab.badge !== undefined && tab.badge !== null) {
      return `${tab.label} (${tab.badge})`;
    }
    return tab.label;
  };

  return (
    <View className={defaultContainerClassName}>
      {tabs.map((tab) => {
        const active = value === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            className={`${defaultTabClassName} ${
              active ? defaultActiveTabClassName : defaultInactiveTabClassName
            }`}
            activeOpacity={0.85}
            onPress={() => onValueChange(tab.id)}>
            <Text
              className={`${defaultTextClassName} ${
                active ? defaultActiveTextClassName : defaultInactiveTextClassName
              }`}>
              {getTabLabel(tab)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

