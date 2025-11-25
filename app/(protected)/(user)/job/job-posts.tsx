import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { getProject } from '~/api/apiservice/project_api';
import { useRouter } from 'expo-router';
import JobsNavTabs from '@/components/job/JobsNavTabs';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import { Calendar, User, Briefcase } from 'lucide-react-native';

export default function JobPosts() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  
  const [searchBy, setSearchBy] = useState('projectName');
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    soleUserId,
    jobPageSearchAPI,
    setJobPageSearchAPI,
    jobPageCurrentProjectPage,
    setJobPageCurrentProjectPage,
  } = useSoleUserContext();

  const searchOptions = useMemo(
    () => [
      { id: 'projectName', label: 'Project Name' },
      { id: 'projectId', label: 'Project ID' },
      { id: 'publisherUsername', label: 'Publisher Username' },
    ],
    []
  );

  // Build search API
  const buildSearchAPI = () => {
    if (!searchValue.trim()) {
      return `&status=Published&pageNo=${jobPageCurrentProjectPage}&pageSize=10&orderBy=id&orderSeq=dec`;
    }

    let searchParam = '';
    switch (searchBy) {
      case 'projectName':
        searchParam = `&projectName=${encodeURIComponent(searchValue)}`;
        break;
      case 'projectId':
        searchParam = `&id=${searchValue}`;
        break;
      case 'publisherUsername':
        searchParam = `&soleUserName=${encodeURIComponent(searchValue)}`;
        break;
    }

    return `${searchParam}&status=Published&pageNo=${jobPageCurrentProjectPage}&pageSize=10&orderBy=id&orderSeq=dec`;
  };

  // Fetch job posts with TanStack Query
  const {
    data: projectResults,
    error: projectsError,
    isLoading: isLoadingProjects,
    refetch: refetchProjects,
    isFetching,
  } = useQuery({
    queryKey: ['jobPosts', soleUserId, jobPageCurrentProjectPage, searchValue, searchBy],
    queryFn: () => getProject(buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [jobPageCurrentProjectPage]);

  const handleJobSearch = () => {
    setJobPageCurrentProjectPage(0);
    setIsSearching(!!searchValue.trim());
    setJobPageSearchAPI(buildSearchAPI());
    refetchProjects();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleJobPress = (projectId: number) => {
    router.push(`/(protected)/(user)/job/job-detail?id=${projectId}` as any);
  };

  const loadMore = () => {
    // Prevent loading if already fetching, no data, or reached last page
    if (isFetching || !projectResults?.data || !projectResults?.totalPages) return;
    
    const hasMorePages = jobPageCurrentProjectPage + 1 < projectResults.totalPages;
    const hasEnoughItems = projectResults.data.length >= 10;
    
    if (hasMorePages && hasEnoughItems) {
      setJobPageCurrentProjectPage(jobPageCurrentProjectPage + 1);
    }
  };

  const totalPages = projectResults?.totalPages || 0;
  const projectsData = projectResults?.data || [];

  const renderJobPost = ({ item }: { item: any }) => {
    const project = item.project || item;
    const userInfoName = item.userInfoName || 'Unknown Client';
    const soleUserName = item.soleUserName;

    return (
      <TouchableOpacity
        onPress={() => handleJobPress(project.id)}
        style={styles.jobCard}
        activeOpacity={0.7}
      >
        {/* Project Image */}
        {project.projectImage && (
          <Image
            source={{ uri: project.projectImage }}
            style={styles.projectImage}
            resizeMode="cover"
          />
        )}

        {/* Project Title */}
        <Text style={styles.projectTitle} numberOfLines={2}>
          {project.projectName}
        </Text>

        {/* Project ID */}
        <View style={styles.infoRow}>
          <Briefcase size={14} color="#9ca3af" />
          <Text style={styles.infoText}>ID: {project.id}</Text>
        </View>

        {/* Client Info */}
        <View style={styles.infoRow}>
          <User size={14} color="#9ca3af" />
          <Text style={styles.clientText}>
            {userInfoName} {soleUserName && `(@${soleUserName})`}
          </Text>
        </View>

        {/* Deadline */}
        {project.applicationDeadline && (
          <View style={styles.infoRow}>
            <Calendar size={14} color="#9ca3af" />
            <Text style={styles.infoText}>
              Deadline: {formatDate(project.applicationDeadline)}
            </Text>
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{project.status}</Text>
        </View>

        {/* Description Preview */}
        {project.projectDescription && (
          <Text style={styles.description} numberOfLines={3}>
            {project.projectDescription}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={projectsData}
          keyExtractor={(item) => (item?.project?.id ?? item?.id ?? Math.random()).toString()}
          ListEmptyComponent={
            <FlatListEmpty
              title="job posts"
              description="No job posts available at the moment"
              isLoading={isLoadingProjects}
              error={projectsError}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <JobsNavTabs />

              <View style={styles.titleSection}>
                <Text style={styles.title}>Job Posts</Text>
                <Text style={styles.subtitle}>Browse available job opportunities</Text>
              </View>

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleJobSearch}
                searchOptions={searchOptions}
              />

              {/* Results Count & Pagination */}
              {projectResults && (
                <View style={styles.resultsRow}>
                  <Text style={styles.resultsText}>
                    {projectResults.total} {projectResults.total === 1 ? 'job' : 'jobs'} found
                    {isSearching && ' (filtered)'}
                  </Text>

                  {totalPages > 1 && (
                    <Text style={styles.pageText}>
                      Page {jobPageCurrentProjectPage + 1} of {totalPages}
                    </Text>
                  )}
                </View>
              )}
            </View>
          }
          renderItem={renderJobPost}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && projectsData.length ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: 20,
            paddingHorizontal: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerContent: {
    marginBottom: 12,
    gap: 8,
  },
  titleSection: {
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
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  pageText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  jobCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  projectImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  clientText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  statusBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fb923c',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
    lineHeight: 20,
  },
});
