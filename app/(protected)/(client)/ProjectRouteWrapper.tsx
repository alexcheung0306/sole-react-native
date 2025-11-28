import ProjectsIndex from './projects/index';
import { useProjectScrollHeader, ProjectScrollProvider, HeaderWrapper } from './projects/_layout';

// Re-export for convenience
export { useProjectScrollHeader };

export default function ProjectRouteWrapper() {
  return (
    <ProjectScrollProvider>
      <HeaderWrapper>
        <ProjectsIndex />
      </HeaderWrapper>
    </ProjectScrollProvider>
  );
}

