import { useState, useEffect } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import { getProjectByIdAndSoleUserId } from '@/api/apiservice/project_api';
import { ChevronLeft } from 'lucide-react-native';

export default function ProjectDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { id } = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { currentTab, setCurrentTab } = useManageProjectContext();

  const projectId = id ? parseInt(id as string) : 0;

  const {
    data: projectData,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectByIdAndSoleUserId(projectId, soleUserId || ''),
    enabled: !!projectId && !!soleUserId,
  });

  const tabs = [
    { id: 'project-information', label: 'Details' },
    { id: 'project-roles', label: 'Roles' },
    { id: 'project-contracts', label: 'Contracts' },
  ];

  const handleTabPress = (tabId: string) => {
    setCurrentTab(tabId);
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Draft: '#6b7280',
      Published: '#f59e0b',
      InProgress: '#10b981',
      Completed: '#3b82f6',
    };
    return colorMap[status] || '#6b7280';
  };

  if (projectLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (projectError || !projectData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const project = projectData.project || projectData;
  const statusColor = getStatusColor(project.status);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader
          title={project.projectName}
          translateY={headerTranslateY}
          isDark={true}
        />
        <ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButtonContainer}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#3b82f6" size={20} />
            <Text style={styles.backLinkText}>Back to Projects</Text>
          </TouchableOpacity>

          {/* Project Status Badges */}
          <View style={styles.badgesContainer}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor + '33' }]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {project.status}
              </Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>Project #{project.id}</Text>
            </View>
          </View>

          {/* Project Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{project.projectName}</Text>
            <Text style={styles.subtitle}>
              Manage your project details, roles, and contracts
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  currentTab === tab.id && styles.activeTab,
                ]}
                onPress={() => handleTabPress(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    currentTab === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {currentTab === 'project-information' && (
            <View style={styles.tabContent}>
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Project Information</Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Description:</Text>
                  <Text style={styles.infoValue}>
                    {project.projectDescription}
                  </Text>
                </View>
                {project.usage && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Usage:</Text>
                    <Text style={styles.infoValue}>{project.usage}</Text>
                  </View>
                )}
                {project.remarks && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Remarks:</Text>
                    <Text style={styles.infoValue}>{project.remarks}</Text>
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Private:</Text>
                  <Text style={styles.infoValue}>
                    {project.isPrivate ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {currentTab === 'project-roles' && (
            <View style={styles.tabContent}>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>Roles Management</Text>
                <Text style={styles.comingSoonSubtext}>
                  Manage project roles and candidates
                </Text>
              </View>
            </View>
          )}

          {currentTab === 'project-contracts' && (
            <View style={styles.tabContent}>
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>Contracts Management</Text>
                <Text style={styles.comingSoonSubtext}>
                  View and manage project contracts
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backLinkText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  idBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  tabContent: {
    minHeight: 300,
  },
  infoSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  comingSoon: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

