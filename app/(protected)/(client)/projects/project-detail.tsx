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
import { ChevronLeft } from 'lucide-react-native';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { useManageProjectContext } from '@/context/ManageProjectContext';
import { useProjectDetailQueries } from '@/hooks/useProjectDetailQueries';
import { ProjectRolesTab } from '@/components/projects/detail/ProjectRolesTab';
import { ProjectContractsTab } from '@/components/projects/detail/ProjectContractsTab';
import { ProjectInformationCard } from '@/components/projects/detail/ProjectInformationCard';
import { CreateProjectAnnouncementDrawer } from '@/components/projects/detail/CreateProjectAnnouncementDrawer';
import { ProjectAnnouncementsList } from '@/components/projects/detail/ProjectAnnouncementsList';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#6b7280',
  Published: '#f59e0b',
  InProgress: '#10b981',
  Completed: '#3b82f6',
};

export default function ProjectDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { id } = useLocalSearchParams();
  const { soleUserId } = useSoleUserContext();
  const { currentTab, setCurrentTab } = useManageProjectContext();

  const projectId = id ? parseInt(id as string, 10) : 0;

  const {
    projectData,
    rolesWithSchedules,
    jobContractsData,
    projectLoading,
    projectError,
    jobContractsLoading,
    roleCount,
    countJobActivities,
    refetchRoles,
    refetchContracts,
  } = useProjectDetailQueries({ projectId, soleUserId: soleUserId || '' });

  const isInitialLoading = projectLoading;

  if (isInitialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Fetching project workspace…</Text>
      </View>
    );
  }

  if (projectError || !projectData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>We couldn’t load this project.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to projects</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const project = projectData?.project || projectData;
  const statusTint = STATUS_COLORS[project?.status] || STATUS_COLORS.Draft;

  const tabs = [
    { id: 'project-information', label: 'Details' },
    { id: 'project-roles', label: `Roles (${roleCount})` },
    {
      id: 'project-contracts',
      label: `Contracts (${jobContractsData?.content?.length ?? jobContractsData?.length ?? 0})`,
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader
          title={project?.projectName || 'Project'}
          translateY={headerTranslateY}
          isDark
        />
        <ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 28,
            paddingHorizontal: 24,
            gap: 20,
          }}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
            <ChevronLeft color="#93c5fd" size={20} />
            <Text style={styles.backLinkText}>Back to Manage Projects</Text>
          </TouchableOpacity>

          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusTint}33` }]}>
              <Text style={[styles.statusText, { color: statusTint }]}>{project?.status}</Text>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>Project #{project?.id}</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{project?.projectName}</Text>
            <Text style={styles.subtitle}>
              Align your announcement timeline, audition workflow, and contract statuses in one
              place.
            </Text>
          </View>

          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, active && styles.activeTab]}
                  onPress={() => setCurrentTab(tab.id)}>
                  <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/*-------------------------------------------- project information --------------------------------------------*/}

          {currentTab === 'project-information' && (
            <>
              <ProjectInformationCard project={project} />
              <CreateProjectAnnouncementDrawer
                projectId={projectId}
                soleUserId={soleUserId || ''}
                projectStatus={project?.status}
                rolesWithSchedules={rolesWithSchedules}
              />
              <ProjectAnnouncementsList projectId={projectId} />
            </>
          )}

          {/*-------------------------------------------- project roles --------------------------------------------*/}
          {currentTab === 'project-roles' && (
            <ProjectRolesTab
              projectId={projectId}
              projectStatus={project?.status}
              rolesWithSchedules={rolesWithSchedules}
              countJobActivities={countJobActivities}
              refetchRoles={refetchRoles}
            />
          )}

          {/*-------------------------------------------- project contracts --------------------------------------------*/}

          {currentTab === 'project-contracts' && (
            <ProjectContractsTab
              projectId={projectId}
              initialContracts={
                Array.isArray(jobContractsData)
                  ? jobContractsData
                  : (jobContractsData?.content ?? jobContractsData?.data ?? [])
              }
              isLoadingInitial={jobContractsLoading}
              refetchContracts={refetchContracts}
            />
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
