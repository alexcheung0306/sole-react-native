import React, { useState } from 'react';
import { ManageContractProvider } from '~/context/ManageContractContext';
import { ManageProjectProvider } from '~/context/ManageProjectContext';
import ManageProjectsPage from './manage-projects';
import ManageContractsPage from './manage-contracts';
import ProjectTabContainer from '@/components/projects/ProjectTabContainer';
import ProjectDetailPage from './project-detail';
import ContractDetailPage from './contract';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import ProjectsNavTabs from '~/components/projects/ProjectsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';

type ProjectTab = 'manage-projects' | 'manage-contracts';

export default React.memo(function ProjectsIndex() {
  const { headerTranslateY, handleScroll } = useScrollHeader();
  const [activeTab, setActiveTab] = useState<ProjectTab>('manage-projects');

  return (
    <>
      <CollapsibleHeader
        title={<ProjectsNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />}
        translateY={headerTranslateY}
        isDark={true}
      />

      <ManageProjectProvider>
        <ManageContractProvider>

          {/* Container for the tabs translation */}
          <ProjectTabContainer activeTab={activeTab}>
            <ManageProjectsPage />
            <ManageContractsPage />
            <ProjectDetailPage />
            <ContractDetailPage />
          </ProjectTabContainer>

        </ManageContractProvider>
      </ManageProjectProvider>
    </>
  );
});

