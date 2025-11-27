import { JobPostsProvider } from '@/context/JobPostsContext';
import { AppliedRolesProvider } from '@/context/AppliedRolesContext';
import { MyContractsProvider } from '@/context/MyContractsContext';
import JobIndex from './job/index';

export default function JobRouteWrapper() {
  return (
    <JobPostsProvider>
      <AppliedRolesProvider>
        <MyContractsProvider>
          <JobIndex />
        </MyContractsProvider>
      </AppliedRolesProvider>
    </JobPostsProvider>
  );
}

