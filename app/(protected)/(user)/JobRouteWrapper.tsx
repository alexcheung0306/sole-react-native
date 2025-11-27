import { View } from 'react-native';
import { JobPostsProvider } from '@/context/JobPostsContext';
import { AppliedRolesProvider } from '@/context/AppliedRolesContext';
import { MyContractsProvider } from '@/context/MyContractsContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import JobsNavTabs from '@/components/job/JobsNavTabs';
import JobIndex from './job/index';
import { useJobScrollHeader, JobScrollProvider } from './job/_layout';

// Re-export for convenience
export { useJobScrollHeader };

function JobHeaderWrapper({ children }: { children: React.ReactNode }) {
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

export default function JobRouteWrapper() {
  return (
    <JobPostsProvider>
      <AppliedRolesProvider>
        <MyContractsProvider>
          <JobScrollProvider>
            <JobHeaderWrapper>
              <JobIndex />
            </JobHeaderWrapper>
          </JobScrollProvider>
        </MyContractsProvider>
      </AppliedRolesProvider>
    </JobPostsProvider>
  );
}

