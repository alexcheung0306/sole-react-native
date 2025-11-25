import { useEffect, useMemo, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { talentSearchJobContracts } from '~/api/apiservice/jobContracts_api';
import { useRouter } from 'expo-router';
import JobsNavTabs from '@/components/job/JobsNavTabs';
import FilterSearch from '~/components/custom/filter-search';
import FlatListEmpty from '~/components/custom/flatlist-empty';
import { FileCheck, Calendar, Briefcase } from 'lucide-react-native';

export default function MyContracts() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { headerTranslateY, handleScroll } = useScrollHeader();
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
          searchParam = `projectName=${encodeURIComponent(searchValue)}&`;
          break;
        case 'projectId':
          searchParam = `projectId=${searchValue}&`;
          break;
        case 'publisherUsername':
          searchParam = `clientName=${encodeURIComponent(searchValue)}&`;
          break;
      }
    }
    return `${searchParam}pageNo=${currentPage}&pageSize=10&orderBy=createdAt&orderSeq=desc`;
  };

  // Fetch contracts with TanStack Query
  const {
    data: contractsData,
    error: contractsError,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['myContracts', soleUserId, currentPage, searchValue, searchBy],
    queryFn: () => talentSearchJobContracts(soleUserId as string, buildSearchAPI()),
    enabled: !!soleUserId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [currentPage]);

  const handleContractSearch = () => {
    setCurrentPage(0);
    setIsSearching(!!searchValue.trim());
    refetch();
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'active':
      case 'activated':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'completed':
        return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      case 'pending':
      case 'offered':
        return { bg: 'rgba(250, 204, 21, 0.2)', text: '#facc15' };
      case 'accepted':
        return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'rejected':
      case 'cancelled':
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

  const handleContractPress = (contract: any) => {
    router.push(`/(protected)/(user)/job/contract-detail?id=${contract.id}` as any);
  };

  const loadMore = () => {
    if (contractsData?.data && contractsData.data.length >= 10) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const totalPages = Math.ceil((contractsData?.total || 0) / 10);
  const contractsList = contractsData?.data || [];

  const renderContract = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.contractStatus);
    const conditionsCount = item.conditions?.length || 0;

    return (
      <TouchableOpacity
        onPress={() => handleContractPress(item)}
        style={styles.contractCard}
        activeOpacity={0.7}
      >
        {/* Contract ID Badge */}
        <View style={styles.contractHeader}>
          <View style={styles.contractIdRow}>
            <FileCheck size={16} color="#3b82f6" />
            <Text style={styles.contractIdText}>
              Contract #{item.id}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.contractStatus}
            </Text>
          </View>
        </View>

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

        {/* Project & Role IDs */}
        <Text style={styles.idText}>
          Project ID: {item.projectId} | Role ID: {item.roleId}
        </Text>

        {/* Conditions Count */}
        {conditionsCount > 0 && (
          <View style={styles.infoRow}>
            <FileCheck size={14} color="#9ca3af" />
            <Text style={styles.conditionsText}>
              {conditionsCount} {conditionsCount === 1 ? 'Condition' : 'Conditions'}
            </Text>
          </View>
        )}

        {/* Created Date */}
        {item.createdAt && (
          <View style={styles.dateRow}>
            <Calendar size={12} color="#9ca3af" />
            <Text style={styles.dateText}>
              Created: {formatDate(item.createdAt)}
            </Text>
          </View>
        )}

        {/* Remarks */}
        {item.remarks && (
          <Text style={styles.remarksText} numberOfLines={2}>
            "{item.remarks}"
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader title="Jobs" translateY={headerTranslateY} isDark={true} />
        <FlatList
          ref={flatListRef}
          data={contractsList}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          ListEmptyComponent={
            <FlatListEmpty
              title="contracts"
              description={searchValue ? 'No contracts found matching your search' : "You don't have any contracts yet"}
              isLoading={isLoading}
              error={contractsError}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <JobsNavTabs />

              <View style={styles.titleSection}>
                <Text style={styles.title}>My Contracts</Text>
                <Text style={styles.subtitle}>Manage your job contracts</Text>
              </View>

              {/* Search Bar */}
              <FilterSearch
                searchBy={searchBy}
                setSearchBy={setSearchBy}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={handleContractSearch}
                searchOptions={searchOptions}
              />

              {/* Results Count & Pagination */}
              {contractsData && (
                <View style={styles.resultsRow}>
                  <Text style={styles.resultsText}>
                    {contractsData.total} {contractsData.total === 1 ? 'contract' : 'contracts'} found
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
          renderItem={renderContract}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching && contractsList.length ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color="#3b82f6" />
              </View>
            ) : null
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
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
  contractCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contractIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractIdText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
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
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  conditionsText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
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
