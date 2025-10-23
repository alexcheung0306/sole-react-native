import { useEffect } from 'react';
import { router } from 'expo-router';

export default function JobIndex() {
  useEffect(() => {
    // Redirect to job-posts by default when job tab is clicked
    router.replace('/(protected)/(user)/job/job-posts' as any);
  }, []);

  return null; // This component doesn't render anything
}
