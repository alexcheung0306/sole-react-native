import { API_BASE_URL, fetchWithTimeout } from '../apiservice';
import { ServerMaintenanceError } from '~/lib/errors';

interface ComcardPhoto {
  id: number;
  comcardId: number;
  photoUrl: string;
  displayOrder: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ComcardWithPhotosResponse {
  id: number;
  configId: number;
  isActive: boolean;
  soleUserId: string;
  pdf: string;
  png: string;
  bucket: string | null;
  comcardImageName: string | null;
  length: number;
  talentNameColor: string | null;
  comcardPhotoList: ComcardPhoto[];
}

export interface ComCard {
  id: number;
  configId: number;
  isActive: boolean;
  soleUserId: string;
  pdf: string;
  png: string;
  bucket: string | null;
  comcardImageName: string | null;
  length: number;
  talentNameColor: string | null;
}

interface TalentInfo {
  id: number;
  talentName: string;
  gender: string;
  eyeColor: string;
  hairColor: string;
  age: number;
  height: number;
  chest: number;
  waist: number;
  hip: number;
  shoes: number;
  ethnic: string;
  region: string;
  experience: string;
  snapshotHalfBody: string;
  snapshotFullBody: string;
  bucket: string | null;
  soleUserId: string;
  comcardId: string | null;
}

interface UserInfo {
  id: number;
  profilePic: string;
  name: string;
  bio: string;
  category: string;
  soleUserId: string;
  bucket: string | null;
  profilePicName: string | null;
}

interface CreateUser {
  username: string;
  email: string;
  clerkId: string;
  image: string;
}

export interface UserProfileData {
  comcard?: ComCard | null;
  comcardWithPhotosResponse?: ComcardWithPhotosResponse | null;
  talentInfo: TalentInfo | null;
  userInfo: UserInfo | null;
  talentLevel: string | null;
  clientLevel?: string | null;
  soleUser?: {
    id: string;
    username: string;
    email: string;
    clerkId: string;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripeCurrentPeriodEnd: string | null;
    clientId: string | null;
    talentLevel: string | null;
    clientLevel: string | null;
    talentReferral: string | null;
    clientReferral: string | null;
    talentReferralCode: string | null;
    clientReferralCode: string | null;
  } | null;
}

export const getUserProfileByUsername = async (
  username: string
): Promise<UserProfileData> => {
  try {
    // Validate username
    if (!username || username === 'Unknown User' || username.trim() === '') {
      console.warn(`Invalid or fallback username: ${username}`);
      return {
        comcard: null,
        comcardWithPhotosResponse: null,
        talentInfo: null,
        userInfo: null,
        talentLevel: null,
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/sole-users/profile/username/${username}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`User profile not found for username: ${username}`);
        return {
          comcard: null,
          comcardWithPhotosResponse: null,
          talentInfo: null,
          userInfo: null,
          talentLevel: null,
        };
      }
      throw new Error(`Error: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Empty response from server');
    }

    const result = JSON.parse(text);
    return result;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const createUser = async (user: CreateUser) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/sole-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('Error creating user:', error);
    // Check if it's a connection/timeout error
    if (
      error instanceof ServerMaintenanceError ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('NetworkError') ||
      error?.message?.includes('Network request failed') ||
      error?.message?.includes('timed out') ||
      error?.name === 'AbortError'
    ) {
      throw new ServerMaintenanceError();
    }
    throw error;
  }
};

export interface TalentSearchParams {
  selectedCategories?: string[];
  requiredGender?: string;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  ethnicGroups?: string[];
  orderBy?: string;
  orderSeq?: string;
  pageNo?: number;
  pageSize?: number;
}

export interface TalentSearchResponse {
  data: UserProfileData[];
  total: number;
  page: number;
  pageSize: number;
}

export const searchTalents = async (
  params: TalentSearchParams
): Promise<TalentSearchResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params.selectedCategories && params.selectedCategories.length > 0) {
      params.selectedCategories.forEach((cat) =>
        queryParams.append('selectedCategories', cat)
      );
    }
    if (params.ethnicGroups && params.ethnicGroups.length > 0) {
      params.ethnicGroups.forEach((ethnic) =>
        queryParams.append('ethnicGroups', ethnic)
      );
    }
    if (params.requiredGender)
      queryParams.append('requiredGender', params.requiredGender);
    if (params.minAge !== undefined)
      queryParams.append('minAge', params.minAge.toString());
    if (params.maxAge !== undefined)
      queryParams.append('maxAge', params.maxAge.toString());
    if (params.minHeight !== undefined)
      queryParams.append('minHeight', params.minHeight.toString());
    if (params.maxHeight !== undefined)
      queryParams.append('maxHeight', params.maxHeight.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.orderSeq) queryParams.append('orderSeq', params.orderSeq);
    if (params.pageNo !== undefined)
      queryParams.append('pageNo', params.pageNo.toString());
    if (params.pageSize !== undefined)
      queryParams.append('pageSize', params.pageSize.toString());
      
    const response = await fetch(
      `${API_BASE_URL}/sole-users/search?${queryParams.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching talents:', error);
    throw error;
  }
};

export interface ActivateTalentProfileResponse {
  success: boolean;
  message: string;
  talentLevel?: string;
}

export const activateTalentProfileWithReferralCode = async (
  soleUserId: string,
  talentReferralCode: string
): Promise<ActivateTalentProfileResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-users/activate/${soleUserId}/${talentReferralCode}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.message || `Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Backend now returns proper JSON with success/message structure
    return {
      success: result.success || true,
      message: result.message || 'Talent profile activated successfully',
      talentLevel: result.talentLevel,
    };
  } catch (error) {
    console.error('Error activating talent profile with referral code:', error);
    throw error;
  }
};

export interface ActivateClientProfileResponse {
  success: boolean;
  message: string;
  clientLevel?: string;
}

export const activateClientProfileWithReferralCode = async (
  soleUserId: string,
  clientReferralCode: string
): Promise<ActivateClientProfileResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sole-users/activate-client/${soleUserId}/${clientReferralCode}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.message || `Error: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Backend now returns proper JSON with success/message structure
    return {
      success: result.success || true,
      message: result.message || 'Client account activated successfully',
      clientLevel: result.clientLevel,
    };
  } catch (error) {
    console.error('Error activating client profile with referral code:', error);
    throw error;
  }
};