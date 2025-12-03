/**
 * Returns hex color code for a given status
 * Supports application statuses, contract statuses, and project statuses
 */
export const getStatusColor = (status: string): string => {
  if (!status) return '#6b7280';
  
  const normalizedStatus = status.toLowerCase().trim();
  
  // Application/Job Applicant Statuses
  const applicationStatuses: Record<string, string> = {
    applied: '#3b82f6',        // blue
    shortlisted: '#facc15',    // yellow
    offered: '#f97316',        // orange
    accepted: '#10b981',       // green
    rejected: '#ef4444',        // red
    pending: '#facc15',        // yellow
    'under review': '#3b82f6', // blue
    interviewed: '#10b981',    // green
    invited: '#3b82f6',        // blue
  };
  
  // Contract Statuses (case-sensitive for some)
  const contractStatuses: Record<string, string> = {
    Pending: '#f59e0b',        // amber
    pending: '#f59e0b',        // amber
    Activated: '#10b981',       // green
    activated: '#10b981',       // green
    active: '#10b981',         // green
    Completed: '#3b82f6',      // blue
    completed: '#3b82f6',      // blue
    Paid: '#8b5cf6',           // purple
    paid: '#8b5cf6',           // purple
    Cancelled: '#ef4444',      // red
    cancelled: '#ef4444',      // red
    'Payment Due': '#f97316',  // orange
    'payment due': '#f97316',  // orange
  };
  
  // Project Statuses
  const projectStatuses: Record<string, string> = {
    Draft: '#6b7280',          // gray
    draft: '#6b7280',          // gray
    Published: '#f59e0b',      // amber
    published: '#f59e0b',      // amber
    InProgress: '#10b981',     // green
    inprogress: '#10b981',     // green
    'in progress': '#10b981',  // green
    'In Progress': '#10b981',  // green
    Completed: '#3b82f6',      // blue
    completed: '#3b82f6',      // blue
    Active: '#10b981',         // green
    active: '#10b981',         // green
    Closed: '#ef4444',         // red
    closed: '#ef4444',         // red
  };
  
  // Check application statuses first
  if (applicationStatuses[normalizedStatus]) {
    return applicationStatuses[normalizedStatus];
  }
  
  // Check contract statuses (try original case first, then normalized)
  if (contractStatuses[status]) {
    return contractStatuses[status];
  }
  if (contractStatuses[normalizedStatus]) {
    return contractStatuses[normalizedStatus];
  }
  
  // Check project statuses (try original case first, then normalized)
  if (projectStatuses[status]) {
    return projectStatuses[status];
  }
  if (projectStatuses[normalizedStatus]) {
    return projectStatuses[normalizedStatus];
  }
  
  // Default gray
  return '#6b7280';
}

/**
 * Returns status color as an object with bg and text properties
 * Useful for components that need both background and text colors
 */
export const getStatusColorObject = (status: string): { bg: string; text: string } => {
  const color = getStatusColor(status);
  return {
    bg: color + '33', // 20% opacity
    text: color,
  };
}
