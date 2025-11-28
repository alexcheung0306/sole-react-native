import { JobPostsProvider } from '@/context/JobPostsContext';
import { AppliedRolesProvider } from '@/context/AppliedRolesContext';
import { MyContractsProvider } from '@/context/MyContractsContext';
import JobIndex from './job/index';
import { View } from 'react-native';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import JobsNavTabs from '~/components/job/JobsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';

function HeaderWrapper({ children }: { children: React.ReactNode }) {
  // Use shared scroll header hook - this will be shared across all job screens
  const { headerTranslateY } = useScrollHeader();

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader title={<JobsNavTabs />} translateY={headerTranslateY} isDark={true} />
      {children}
    </View>
  );
}

export default function JobRouteWrapper() {
  return (
    <JobPostsProvider>
      <AppliedRolesProvider>
        <MyContractsProvider>
          <HeaderWrapper>
            <JobIndex />
          </HeaderWrapper>
        </MyContractsProvider>
      </AppliedRolesProvider>
    </JobPostsProvider>
  );
}
