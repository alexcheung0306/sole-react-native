import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SignUp } from '@clerk/clerk-react';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function SignUpScreen() {
  const { isSignedIn } = useAuth();

  // If already signed in, redirect to main app
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today</Text>
      </View>
      
      <View style={styles.clerkContainer}>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: {
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333',
                },
              },
            },
          }}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Link href="/sign-in" style={styles.link}>
            Sign in
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
  clerkContainer: {
    flex: 1,
    justifyContent: 'center',
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
