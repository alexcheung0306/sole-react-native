import { API_BASE_URL } from '../apiservice';

export interface UserSearchResult {
  comcardWithPhotosResponse: any | null;
  talentInfo: {
    id: number;
    talentName: string;
    gender?: string;
    age?: number;
    height?: number;
    snapshotHalfBody?: string;
    snapshotFullBody?: string;
    ethnic?: string;
    region?: string;
    experience?: string;
    soleUserId?: string;
  } | null;
  userInfo: {
    id: number;
    profilePic?: string;
    name: string;
    bio?: string;
    category?: string;
    soleUserId: string;
    bucket?: string | null;
    profilePicName?: string | null;
  } | null;
  soleUser: {
    id: string;
    username: string;
    email: string;
    clerkId: string;
    image?: string | null;
    createdAt: string;
    updatedAt: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    stripeCurrentPeriodEnd?: string | null;
    stripeAccountId?: string | null;
    stripeAccountStatus?: string;
    clientId?: number | null;
    talentLevel?: string | null;
    clientLevel?: string | null;
    talentReferral?: string | null;
    clientReferral?: string | null;
    talentReferralCode?: string | null;
    clientReferralCode?: string | null;
  };
  talentLevel: string | null;
}

export const autocompleteUsers = async (
  query: string,
  limit: number = 10
): Promise<UserSearchResult[]> => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/user-search/autocomplete?query=${encodeURIComponent(query)}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search users');
  }

  return response.json();
};

