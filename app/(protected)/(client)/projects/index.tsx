import ManageProjectsPage from './manage-projects';
import ManageContractsPage from './manage-contracts';
import ProjectTabContainer from '@/components/projects/ProjectTabContainer';
import ProjectDetailPage from './project-detail';
import ContractDetailPage from './contract';


export default function ProjectsIndex() {
  return (
    <ProjectTabContainer>
      <ManageProjectsPage />
      <ManageContractsPage />
      <ProjectDetailPage />
      <ContractDetailPage />
    </ProjectTabContainer>
  );
}

