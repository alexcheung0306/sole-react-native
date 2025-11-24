import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useOAuth } from '@clerk/clerk-expo';

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Watch for auth state changes and navigate when signed in
  useEffect(() => {
    if (isSignedIn && isLoaded) {
      console.log('Auth state changed: user is now signed in, navigating...');
      router.replace('/(protected)');
    }
  }, [isSignedIn, isLoaded, router]);

  // OAuth hooks
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  // If already signed in, redirect to main app
  if (isSignedIn) {
    return <Redirect href="/(protected)" />;
  }

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
      router.replace('/(protected)');
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const onPressGoogle = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace('/(protected)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const onPressApple = async () => {
    try {
      setLoading(true);
      console.log('Starting Apple OAuth flow...');
      const result = await startAppleOAuth();
      
      // Log result safely without stringifying (to avoid circular reference errors)
      console.log('Apple OAuth response - createdSessionId:', result?.createdSessionId);
      console.log('Apple OAuth response - has setActive:', !!result?.setActive);
      console.log('Apple OAuth response keys:', Object.keys(result || {}));

      const { createdSessionId, setActive, signUp, signIn } = result;

      // If we have a session ID, use it directly
      if (createdSessionId && setActive) {
        console.log('Setting active session with existing session ID...');
        await setActive({ session: createdSessionId });
        console.log('Session set successfully');
        router.replace('/(protected)');
        return;
      }

      // If sign-up is in progress and missing username, complete it
      if (signUp && signUp.missingFields?.includes('username')) {
        console.log('Completing sign-up with generated username...');
        const email = signUp.emailAddress || '';
        // Generate username from email (take part before @ and add random suffix)
        const baseUsername = email.split('@')[0] || 'user';
        const randomSuffix = Math.floor(Math.random() * 10000);
        const username = `${baseUsername}${randomSuffix}`;
        
        console.log('Generated username:', username);
        const updatedSignUp = await signUp.update({ username });
        console.log('Sign-up updated. Status:', updatedSignUp.status);
        console.log('Sign-up createdSessionId:', updatedSignUp.createdSessionId);
        
        if (updatedSignUp.status === 'complete' && updatedSignUp.createdSessionId && setActive) {
          console.log('Sign-up completed, setting active session...');
          await setActive({ session: updatedSignUp.createdSessionId });
          console.log('Session set successfully');
          router.replace('/(protected)');
          return;
        } else {
          console.warn('Sign-up not complete after update. Status:', updatedSignUp.status);
        }
      }

      // If sign-in needs identifier, try to complete it
      if (signIn && signIn._status === 'needs_identifier') {
        console.log('Sign-in needs identifier, attempting to complete...');
        const completeSignIn = await signIn.authenticateWithRedirectOrPopup({ strategy: 'oauth_apple' });
        
        if (completeSignIn.createdSessionId && setActive) {
          console.log('Sign-in completed, setting active session...');
          await setActive({ session: completeSignIn.createdSessionId });
          console.log('Session set successfully');
          router.replace('/(protected)');
          return;
        }
      }

      // If we get here, something went wrong
      console.warn('Apple OAuth: Could not complete authentication. Result:', {
        hasCreatedSessionId: !!createdSessionId,
        hasSetActive: !!setActive,
        signUpStatus: signUp?._status,
        signInStatus: signIn?._status,
      });
      Alert.alert('Error', 'Failed to complete Apple sign in. Please try again.');
    } catch (err: any) {
      console.error('Apple OAuth error:', err);
      console.error('Error message:', err?.message);
      console.error('Error errors array:', err?.errors);
      console.error('Error type:', typeof err);
      Alert.alert(
        'Error', 
        err?.errors?.[0]?.message || err?.message || 'Failed to sign in with Apple'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>
      
      <View style={styles.form}>
        {/* OAuth Buttons */}
        <TouchableOpacity
          style={[styles.oauthButton, styles.googleButton, loading && styles.buttonDisabled]}
          onPress={onPressGoogle}
          disabled={loading || !isLoaded}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.oauthButtonText}>🔵 Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.oauthButton, styles.appleButton, loading && styles.buttonDisabled]}
          onPress={onPressApple}
          disabled={loading || !isLoaded}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.appleButtonText}>🍎 Continue with Apple</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email/Password Form */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={emailAddress}
            onChangeText={setEmailAddress}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSignInPress}
          disabled={loading || !isLoaded}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Link href="/sign-up" style={styles.link}>
            Sign up
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  oauthButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#000',
    fontWeight: '600',
  },
});
