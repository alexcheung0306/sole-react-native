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
import { useSignUp } from '@clerk/clerk-expo';
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useOAuth } from '@clerk/clerk-expo';
import { Eye, EyeOff, Check } from 'lucide-react-native';

export default function SignUpScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength === 0) return { label: '', color: '#E5E7EB' };
    if (strength === 1) return { label: 'Weak', color: '#EF4444' };
    if (strength === 2) return { label: 'Fair', color: '#F59E0B' };
    if (strength === 3) return { label: 'Good', color: '#3B82F6' };
    return { label: 'Strong', color: '#10B981' };
  };

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
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onSignUpPress = async () => {
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
      await signUp.create({
        emailAddress,
        password,
      });

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // Set pending verification to true
      setPendingVerification(true);
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Failed to sign up';
      
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

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(protected)');
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification failed');
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
        Alert.alert('Error', errorMessage || 'Failed to sign up with Google');
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

      const { createdSessionId, setActive, signUp } = result;

      // If we have a session ID, use it directly
      if (createdSessionId && setActive) {
        console.log('Setting active session with existing session ID...');
        await setActive({ session: createdSessionId });
        console.log('Session set successfully');
        router.replace('/(protected)');
        return;
      }

      // If sign-up is in progress and missing username, complete it
      if (signUp) {
        if (signUp.missingFields?.includes('username')) {
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
            console.warn('Missing fields:', updatedSignUp.missingFields);
          }
        }
      }

      // If we get here, something went wrong
      console.warn('Apple OAuth: Could not complete sign-up. Result:', {
        hasCreatedSessionId: !!createdSessionId,
        hasSetActive: !!setActive,
        signUpStatus: signUp?.status,
        missingFields: signUp?.missingFields,
      });
      Alert.alert('Error', 'Failed to complete Apple sign up. Please try again.');
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
          errorMessage || 'Failed to sign up with Apple'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a verification code to{'\n'}
                <Text style={styles.emailHighlight}>{emailAddress}</Text>
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Verification Code</Text>
                <Text style={styles.helpText}>
                  Please enter the 6-digit code sent to your email
                </Text>
                <TextInput
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onPressVerify}
                disabled={loading || !isLoaded}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={async () => {
                  if (!signUp) {
                    Alert.alert('Error', 'Sign up not initialized. Please try again.');
                    return;
                  }
                  try {
                    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                    Alert.alert('Success', 'Verification code resent to your email');
                  } catch (err: any) {
                    Alert.alert('Error', 'Failed to resend code. Please try again.');
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us today and get started</Text>
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
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, passwordError && styles.inputError]}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  onBlur={() => validatePassword(password)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
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
              
              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => {
                      const strengthInfo = getPasswordStrengthLabel(passwordStrength);
                      const isActive = level <= passwordStrength;
                      return (
                        <View
                          key={level}
                          style={[
                            styles.strengthBar,
                            isActive && { backgroundColor: strengthInfo.color },
                          ]}
                        />
                      );
                    })}
                  </View>
                  {passwordStrength > 0 && (
                    <Text style={[styles.strengthLabel, { color: getPasswordStrengthLabel(passwordStrength).color }]}>
                      {getPasswordStrengthLabel(passwordStrength).label}
                    </Text>
                  )}
                </View>
              )}

              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  {[
                    { text: 'At least 8 characters', met: password.length >= 8 },
                    { text: 'Contains uppercase & lowercase', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
                    { text: 'Contains a number', met: /\d/.test(password) },
                    { text: 'Contains a special character', met: /[^a-zA-Z\d]/.test(password) },
                  ].map((req, index) => (
                    <View key={index} style={styles.requirement}>
                      <View style={[styles.checkIcon, req.met && styles.checkIconActive]}>
                        {req.met && <Check size={12} color="#fff" />}
                      </View>
                      <Text style={[styles.requirementText, req.met && styles.requirementTextMet]}>
                        {req.text}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onSignUpPress}
              disabled={loading || !isLoaded}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Link href="/sign-in" style={styles.link}>
                <Text style={styles.linkText}>Sign in</Text>
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
  emailHighlight: {
    fontWeight: '600',
    color: '#111827',
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
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
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
  passwordStrengthContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 12,
  },
  requirementsContainer: {
    marginTop: 12,
    gap: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkIconActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
  },
  requirementTextMet: {
    color: '#10B981',
  },
  codeInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontWeight: '600',
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
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: '#000000',
    fontWeight: '600',
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
