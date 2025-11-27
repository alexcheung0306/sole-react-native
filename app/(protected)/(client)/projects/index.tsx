import ManageProjectsPage from './manage-projects';
import ManageContractsPage from './manage-contracts';
import ProjectTabContainer from '@/components/projects/ProjectTabContainer';

export default function ProjectsIndex() {
  return (
    <ProjectTabContainer>
      <ManageProjectsPage />
      <ManageContractsPage />
    </ProjectTabContainer>
  );
}

