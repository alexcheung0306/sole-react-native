import React, { useState } from 'react';
import { AppliedRolesProvider } from '~/context/AppliedRolesContext';
import { JobPostsProvider } from '~/context/JobPostsContext';
import { MyContractsProvider } from '~/context/MyContractsContext';
import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';
import JobTabContainer from '@/components/job/JobTabContainer';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import JobsNavTabs from '~/components/job/JobsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';

type JobTab = 'job-posts' | 'applied-roles' | 'my-contracts';

export default React.memo(function JobIndex() {
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const [activeTab, setActiveTab] = useState<JobTab>('job-posts');

  return (
    <>
      <CollapsibleHeader 
        title={<JobsNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />} 
        translateY={headerTranslateY} 
        isDark={true} 
      />

      <JobPostsProvider>
        <AppliedRolesProvider>
          <MyContractsProvider>

            <JobTabContainer activeTab={activeTab}>
              <JobPosts />
              <AppliedRoles />
              <MyContracts />
            </JobTabContainer>

          </MyContractsProvider>
        </AppliedRolesProvider>
      </JobPostsProvider>
    </>
  );
});
