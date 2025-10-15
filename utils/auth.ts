import { useAuth, useUser } from '@clerk/clerk-expo';
import { getSoleUserByClerkId } from '~/api/apiservice';
import { createUser } from '~/api/apiservice/soleUser_api';

export const authenticateUser = async () => {
  const { userId } = useAuth();
  const { user } = useUser();
  const clerkUser = user;

  if (!userId) return null;
  try {
    const user = await getSoleUserByClerkId(userId as string);
    if (user) {
      console.log('User found:', user.id);
      return user;
    }else{
        const email = clerkUser?.emailAddresses[0]?.emailAddress || 'default@example.com';
        const clerkProfilePic = clerkUser?.imageUrl;
        const createdUser = await createUser({
          username: clerkUser?.username || 'New User',
          email: email,
          clerkId: userId,
          image: clerkProfilePic || '',
        });
        return createdUser;
    }
   

  } catch (error) {
    console.error('Error fetching or creating user:', error);
    throw new Error('Failed to retrieve or create user');
  }
};
