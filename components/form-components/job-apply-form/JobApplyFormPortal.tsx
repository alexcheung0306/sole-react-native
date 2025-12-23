import React, { useState } from 'react';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/custom/primary-button';

interface JobApplyFormPortalProps {
  projectId: number;
  roleId: number;
  soleUserId?: string | null;
  triggerClassName?: string;
  renderTrigger?: (helpers: {
    open: () => void;
    close: () => void;
    isOpen: boolean;
  }) => React.ReactNode;
}

export default function JobApplyFormPortal({
  projectId,
  roleId,
  soleUserId,
  triggerClassName,
  renderTrigger,
}: JobApplyFormPortalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleOpen = () => {
    if (!soleUserId) {
      // Handle sign in requirement - could show alert or navigate to sign in
      return;
    }

    // Prevent multiple navigations
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    const params: Record<string, string> = {
      formType: 'jobApply',
      projectId: String(projectId),
      roleId: String(roleId),
      soleUserId: soleUserId,
    };

    router.push({
      pathname: '/(protected)/form/[formType]' as any,
      params,
    });

    // Reset navigation state after a delay to allow navigation to complete
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  if (renderTrigger) {
    return (
      <>
        {renderTrigger({
          open: handleOpen,
          close: () => {},
          isOpen: false,
        })}
      </>
    );
  }

  return (
    <PrimaryButton
      className={triggerClassName || 'mt-4 w-full bg-blue-500'}
      onPress={handleOpen}
      disabled={!soleUserId || isNavigating}>
      {!soleUserId ? 'Sign in to apply' : 'Open apply form'}
    </PrimaryButton>
  );
}
