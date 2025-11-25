import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useOAuth } from '@clerk/clerk-expo';
import { Eye, EyeOff } from 'lucide-react-native';

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (pwd: string) => {
    if (!pwd) {
      setPasswordError('Password is required');
      return false;
    }
    if (pwd.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    // Validate inputs
    const isEmailValid = validateEmail(emailAddress);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
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
      const errorMessage = err.errors?.[0]?.message || 'Failed to sign in';
      
      // Set specific field errors if available
      if (errorMessage.toLowerCase().includes('email')) {
        setEmailError(errorMessage);
      } else if (errorMessage.toLowerCase().includes('password')) {
        setPasswordError(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
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
      // Check if user cancelled the OAuth flow
      const errorMessage = err?.errors?.[0]?.message || err?.message || '';
      const isCancelled = 
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('user_cancelled') ||
        err?.code === 'user_cancelled' ||
        err?.status === 'cancelled';
      
      // Only show error if it's not a cancellation
      if (!isCancelled) {
        Alert.alert('Error', errorMessage || 'Failed to sign in with Google');
      }
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
      if (signIn && signIn.status === 'needs_identifier') {
        console.log('Sign-in needs identifier, but cannot complete in mobile OAuth flow');
        // In mobile OAuth, we can't complete sign-in that needs identifier
        // The user should try again or use a different method
      }

      // If we get here, something went wrong
      console.warn('Apple OAuth: Could not complete authentication. Result:', {
        hasCreatedSessionId: !!createdSessionId,
        hasSetActive: !!setActive,
        signUpStatus: signUp?.status,
        signInStatus: signIn?.status,
      });
      Alert.alert('Error', 'Failed to complete Apple sign in. Please try again.');
    } catch (err: any) {
      // Check if user cancelled the OAuth flow
      const errorMessage = err?.errors?.[0]?.message || err?.message || '';
      const isCancelled = 
        errorMessage.toLowerCase().includes('cancel') ||
        errorMessage.toLowerCase().includes('user_cancelled') ||
        err?.code === 'user_cancelled' ||
        err?.status === 'cancelled';
      
      // Only show error if it's not a cancellation
      if (!isCancelled) {
        console.error('Apple OAuth error:', err);
        console.error('Error message:', err?.message);
        console.error('Error errors array:', err?.errors);
        console.error('Error type:', typeof err);
        Alert.alert(
          'Error', 
          errorMessage || 'Failed to sign in with Apple'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to your account</Text>
          </View>
          
          {/* OAuth Buttons */}
          <View style={styles.oauthSection}>
            <TouchableOpacity
              style={[styles.oauthButton, styles.googleButton, loading && styles.buttonDisabled]}
              onPress={onPressGoogle}
              disabled={loading || !isLoaded}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <View style={styles.oauthButtonContent}>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.oauthButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, styles.appleButton, loading && styles.buttonDisabled]}
              onPress={onPressApple}
              disabled={loading || !isLoaded}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View style={styles.oauthButtonContent}>
                  <Text style={styles.appleIcon}>🍎</Text>
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email/Password Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={emailAddress}
                onChangeText={(text) => {
                  setEmailAddress(text);
                  if (emailError) setEmailError('');
                }}
                onBlur={() => validateEmail(emailAddress)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Please contact support to reset your password.')}>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, passwordError && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  onBlur={() => validatePassword(password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onSignInPress}
              disabled={loading || !isLoaded}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Link href="/sign-up" style={styles.link}>
                <Text style={styles.linkText}>Sign up</Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  oauthSection: {
    marginBottom: 24,
  },
  oauthButton: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  oauthButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.2,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    marginLeft: 4,
  },
  linkText: {
    color: '#000000',
    fontWeight: '600',
  },
});
