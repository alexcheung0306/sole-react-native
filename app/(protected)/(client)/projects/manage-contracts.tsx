import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import { useQuery } from '@tanstack/react-query';
import { useSoleUserContext } from '@/context/SoleUserContext';
import { clientSearchJobContracts } from '@/api/apiservice/jobContracts_api';
import { formatDateTime } from '@/utils/time-converts';
import { Search, ChevronLeft } from 'lucide-react-native';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';
import ContractSearchBar from '@/components/projects/ContractSearchBar';

export default function ManageContractsPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const { soleUserId } = useSoleUserContext();

  const [searchBy, setSearchBy] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [pageNo, setPageNo] = useState('0');
  const [searchTrigger, setSearchTrigger] = useState(0);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    
    if (searchBy && searchValue) {
      params.append(searchBy, searchValue);
    }
    if (selectedStatuses.length > 0) {
      selectedStatuses.forEach((status) => {
        params.append('contractStatus', status);
      });
    }
    params.append('orderBy', 'createdAt');
    params.append('orderSeq', 'desc');
    params.append('pageNo', pageNo);
    params.append('pageSize', '20');
    return params.toString();
  };

  const handleSearch = () => {
    setPageNo('0'); // Reset to first page when searching
    setSearchTrigger((prev) => prev + 1); // Trigger search
  };

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value);
    // If search value is empty, reset to show all contracts
    if (!value) {
      setPageNo('0');
      setSearchTrigger((prev) => prev + 1);
    }
  };

  const searchUrl = buildSearchUrl();

  const {
    data: contractResults,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['manageContracts', soleUserId, searchUrl, searchTrigger],
    queryFn: () => clientSearchJobContracts(soleUserId, searchUrl),
    enabled: !!soleUserId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleContractPress = (contractId: number) => {
    router.push({
      pathname: '/(protected)/(client)/projects/contract',
      params: { id: contractId },
    });
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Pending: '#f59e0b',
      Activated: '#10b981',
      Completed: '#3b82f6',
      Paid: '#8b5cf6',
      Cancelled: '#ef4444',
    };
    return colorMap[status] || '#6b7280';
  };

  const renderContract = ({ item }: { item: any }) => {
    const contract = item.jobContract || item;
    const statusColor = getStatusColor(contract.contractStatus);

    return (
      <TouchableOpacity
        className="bg-gray-800/60 rounded-xl p-4 mb-3 border border-white/10"
        onPress={() => handleContractPress(contract.id)}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-bold text-white">Contract #{contract.id}</Text>
          <View
            className="px-2.5 py-1 rounded-xl"
            style={{ backgroundColor: statusColor + '33' }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: statusColor }}>
              {contract.contractStatus}
            </Text>
          </View>
        </View>

        <Text className="text-base font-semibold text-white mb-1" numberOfLines={1}>
          {contract.projectName}
        </Text>

        <Text className="text-sm text-gray-300 mb-1" numberOfLines={1}>
          Role: {contract.roleTitle}
        </Text>

        <Text className="text-xs text-gray-400 mb-2">
          Created: {formatDateTime(contract.createdAt)}
        </Text>

        {contract.remarks && (
          <Text className="text-[13px] text-gray-400 leading-[18px]" numberOfLines={2}>
            {contract.remarks}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Projects Navigation Tabs */}
      <ProjectsNavTabs />

      {/* Header */}
      <View className="mb-5">
        <Text className="text-[28px] font-bold text-white mb-1">Manage Contracts</Text>
        <Text className="text-sm text-gray-400">View and manage all contracts</Text>
      </View>

      {/* Search and Filter Bar */}
      <ContractSearchBar
        searchBy={searchBy}
        setSearchBy={setSearchBy}
        searchValue={searchValue}
        setSearchValue={handleSearchValueChange}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        onSearch={handleSearch}
      />

      {/* Results Count */}
      {contractResults && (
        <Text className="text-sm text-gray-400 mb-3">
          {contractResults.total}{' '}
          {contractResults.total === 1 ? 'contract' : 'contracts'} found
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="py-15 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-3 text-sm">Loading contracts...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="py-15 items-center">
          <Text className="text-red-400 text-base font-semibold">Error loading contracts</Text>
        </View>
      );
    }

    return (
      <View className="py-15 items-center">
        <Text className="text-gray-400 text-base">No contracts found</Text>
      </View>
    );
  };

  const contractsData = contractResults?.data || [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          title="Manage Contracts"
          translateY={headerTranslateY}
          isDark={true}
        />
        <FlatList
          data={contractsData}
          renderItem={renderContract}
          keyExtractor={(item) => (item.jobContract?.id || item.id).toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

