import { Stack } from 'expo-router';
import { createContext, useContext, ReactNode } from 'react';
import { View } from 'react-native';
import { JobTabProvider } from '@/context/JobTabContext';
import { JobPostsProvider } from '@/context/JobPostsContext';
import { AppliedRolesProvider } from '@/context/AppliedRolesContext';
import { MyContractsProvider } from '@/context/MyContractsContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import JobsNavTabs from '@/components/job/JobsNavTabs';
import { useScrollHeader } from '@/hooks/useScrollHeader';

// Create a context to share the scroll handler across job screens
const JobScrollContext = createContext<ReturnType<typeof useScrollHeader> | null>(null);

export const useJobScrollHeader = () => {
  const context = useContext(JobScrollContext);
  if (!context) {
    throw new Error('useJobScrollHeader must be used within JobScrollProvider');
  }
  return context;
};

export function JobScrollProvider({ children }: { children: ReactNode }) {
  const scrollHeader = useScrollHeader();
  return (
    <JobScrollContext.Provider value={scrollHeader}>
      {children}
    </JobScrollContext.Provider>
  );
}

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  // Use shared scroll header hook - this will be shared across all job screens
  const { headerTranslateY } = useJobScrollHeader();

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader
        title={<JobsNavTabs />}
        translateY={headerTranslateY}
        isDark={true}
      />
      {children}
    </View>
  );
}

export default function JobLayout() {
  return (
    <JobTabProvider>
      <JobPostsProvider>
        <AppliedRolesProvider>
          <MyContractsProvider>
            <JobScrollProvider>
              <HeaderWrapper>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#000000' },
                  }}
                >
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="job-posts" options={{ headerShown: false }} />
                  <Stack.Screen name="applied-roles" options={{ headerShown: false }} />
                  <Stack.Screen name="my-contracts" options={{ headerShown: false }} />
                  <Stack.Screen name="job-detail" options={{ headerShown: false }} />
                </Stack>
              </HeaderWrapper>
            </JobScrollProvider>
          </MyContractsProvider>
        </AppliedRolesProvider>
      </JobPostsProvider>
    </JobTabProvider>
  );
}
