import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { getJobApplicantsByUser } from '~/api/apiservice/applicant_api';
import { useRouter } from 'expo-router';
import JobsNavTabs from '@/components/job/JobsNavTabs';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import { Calendar, Briefcase, FileText } from 'lucide-react-native';

export default function AppliedRoles() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  
  const [searchBy, setSearchBy] = useState('projectName');
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const { soleUserId } = useSoleUserContext();

  const searchOptions = useMemo(
    () => [
      { id: 'projectName', label: 'Project Name' },
      { id: 'projectId', label: 'Project ID' },
      { id: 'publisherUsername', label: 'Publisher Username' },
    ],
    []
  );

  // Build search API string
  const buildSearchAPI = () => {
    let searchParam = '';
    if (searchValue.trim()) {
      switch (searchBy) {
        case 'projectName':
          searchParam = `&projectName=${encodeURIComponent(searchValue)}`;
          break;
        case 'projectId':
          searchParam = `&projectId=${searchValue}`;
          break;
        case 'publisherUsername':
          searchParam = `&soleUserName=${encodeURIComponent(searchValue)}`;
          break;
      }
    }
    return `pageNo=${currentPage}&pageSize=10${searchParam}`;
  };

  // Fetch applied roles with TanStack Query
  const {
    data: appliedRolesData,
    error: appliedRolesError,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['appliedRoles', soleUserId, currentPage, searchValue, searchBy],
    queryFn: () => getJobApplicantsByUser(soleUserId as string, buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const handleApplicationSearch = () => {
    setCurrentPage(0);
    setIsSearching(!!searchValue.trim());
    refetch();
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
      case 'applied':
        return { bg: 'rgba(250, 204, 21, 0.2)', text: '#facc15' };
      case 'under review':
      case 'shortlisted':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      case 'interviewed':
      case 'offered':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleApplicationPress = (application: any) => {
    router.push(`/(protected)/(user)/job/job-detail?id=${application.projectId}&roleId=${application.roleId}` as any);
  };

  const loadMore = () => {
    // Prevent loading if already fetching, no data, or reached last page
    if (isFetching || !appliedRolesData?.data) return;
    
    const totalPages = Math.ceil((appliedRolesData?.total || 0) / 10);
    const hasMorePages = currentPage + 1 < totalPages;
    const hasEnoughItems = appliedRolesData.data.length >= 10;
    
    if (hasMorePages && hasEnoughItems) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const totalPages = Math.ceil((appliedRolesData?.total || 0) / 10);
  const applicationsData = appliedRolesData?.data || [];

  const renderAppliedRole = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.applicationProcess || item.applicationStatus);
    
    return (
      <TouchableOpacity
        onPress={() => handleApplicationPress(item)}
        style={styles.applicationCard}
        activeOpacity={0.7}
      >
        {/* Role Title */}
        <Text style={styles.roleTitle} numberOfLines={2}>
          {item.roleTitle || 'Unnamed Role'}
        </Text>

        {/* Project Info */}
        <View style={styles.infoRow}>
          <Briefcase size={14} color="#9ca3af" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.projectName || `Project #${item.projectId}`}
          </Text>
        </View>

        {/* Project ID */}
        <View style={styles.infoRow}>
          <FileText size={14} color="#9ca3af" />
          <Text style={styles.idText}>
            Project ID: {item.projectId} | Role ID: {item.roleId}
          </Text>
        </View>

        {/* Publisher */}
        {item.publisherUsername && (
          <Text style={styles.publisherText}>
            By: {item.publisherUsername}
          </Text>
        )}

        {/* Application Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.applicationProcess || item.applicationStatus || 'Pending'}
            </Text>
          </View>
          
          {item.appliedAt && (
            <View style={styles.dateRow}>
              <Calendar size={12} color="#9ca3af" />
              <Text style={styles.dateText}>
                {formatDate(item.appliedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Additional Info */}
        {item.remarks && (
          <Text style={styles.remarksText} numberOfLines={2}>
            {item.remarks}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={applicationsData}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          ListEmptyComponent={
            <FlatListEmpty
              title="applications"
              description={searchValue ? 'No applications found matching your search' : "You haven't applied to any roles yet"}
              isLoading={isLoading}
              error={appliedRolesError}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <JobsNavTabs />

              <View style={styles.titleSection}>
                <Text style={styles.title}>Applied Roles</Text>
                <Text style={styles.subtitle}>Track your job applications</Text>
              </View>

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleApplicationSearch}
                searchOptions={searchOptions}
              />

              {/* Results Count & Pagination */}
              {appliedRolesData && (
                <View style={styles.resultsRow}>
                  <Text style={styles.resultsText}>
                    {appliedRolesData.total} {appliedRolesData.total === 1 ? 'application' : 'applications'} found
                    {isSearching && ' (filtered)'}
                  </Text>

                  {totalPages > 1 && (
                    <Text style={styles.pageText}>
                      Page {currentPage + 1} of {totalPages}
                    </Text>
                  )}
                </View>
              )}
            </View>
          }
          renderItem={renderAppliedRole}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && applicationsData.length ? (
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
  applicationCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleTitle: {
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
    color: '#d1d5db',
    flex: 1,
  },
  idText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  publisherText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  remarksText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
