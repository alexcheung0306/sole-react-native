import { clerkClient } from '@clerk/clerk-sdk-node';

export const getClerkUserById = async (userId: string) => {
    try {
        const user = await clerkClient.users.getUser(userId);
        return user;
    } catch (error) {
        console.error('Error fetching Clerk user:', error);
        throw new Error('Failed to fetch Clerk user');
    }
};
