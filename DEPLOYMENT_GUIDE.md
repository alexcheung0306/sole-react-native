# 🚀 Sole App - Production Deployment Guide

This guide will walk you through deploying your Sole app backend to production and building your mobile app for the App Store and Google Play Store.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Deployment](#backend-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Mobile App Build & Deploy](#mobile-app-build--deploy)
5. [Post-Deployment](#post-deployment)

---

## 🎯 Overview

### Architecture

```
Mobile App (React Native + Expo)
    ↓
    ↓ HTTPS API Calls
    ↓
Cloud Backend (Spring Boot)
    ↓
    ↓ Database Queries
    ↓
PostgreSQL Database (Cloud)
```

### Environments

- **Development**: Local machine (`localhost:8080`)
- **Staging**: Pre-production testing (`staging-api.yourdomain.com`)
- **Production**: Live app (`api.yourdomain.com`)

---

## 🖥️ Backend Deployment

### Option 1: Railway (Recommended - Easiest)

**Why Railway?**
- Automatic deployments from Git
- Built-in PostgreSQL database
- Free SSL certificates
- $5/month for hobby tier
- Zero DevOps required

**Steps:**

1. **Sign up for Railway**: https://railway.app

2. **Create New Project**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Navigate to your backend directory
   cd path/to/your/spring-boot-backend
   
   # Initialize Railway project
   railway init
   ```

3. **Add PostgreSQL**:
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

4. **Configure Environment Variables** in Railway Dashboard:
   ```
   DATABASE_URL=(auto-provided)
   MINIO_ENDPOINT=your-minio-endpoint
   MINIO_ACCESS_KEY=your-access-key
   MINIO_SECRET_KEY=your-secret-key
   CLERK_SECRET_KEY=your-clerk-secret
   STRIPE_API_KEY=your-stripe-key
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

6. **Get Your Domain**:
   - Railway provides: `your-app.railway.app`
   - Or connect custom domain: `api.yourdomain.com`

---

### Option 2: Render

**Steps:**

1. **Sign up**: https://render.com

2. **Create Web Service**:
   - Connect your GitHub repository
   - Build Command: `./mvnw clean package -DskipTests` (or `./gradlew build`)
   - Start Command: `java -jar target/your-app.jar`
   - Environment: Docker

3. **Add PostgreSQL Database**:
   - Create new PostgreSQL database in Render
   - Copy connection string

4. **Set Environment Variables**

5. **Deploy** - Automatic from Git pushes

---

### Option 3: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize (in backend directory)
fly launch

# Deploy
fly deploy
```

---

### Option 4: DigitalOcean App Platform

1. Create account at https://digitalocean.com
2. Go to App Platform
3. Connect GitHub repository
4. Add managed PostgreSQL database ($15/mo)
5. Configure environment variables
6. Deploy

---

## 🔧 Environment Configuration

### Update Mobile App Environment Files

After deploying your backend, update the `.env` files:

#### `.env.staging`
```bash
EXPO_PUBLIC_API_URL=https://your-staging-backend.railway.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

#### `.env.production`
```bash
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Backend CORS Configuration

**IMPORTANT**: Your Spring Boot backend must allow requests from your mobile app.

**Update your Spring Boot CORS configuration**:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:8081",  // Development
                    "https://yoursoleapp.com", // Production
                    "capacitor://localhost",   // Capacitor apps
                    "ionic://localhost"        // Ionic apps
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

**Or for Spring Security**:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:8081",
        "https://yoursoleapp.com"
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
}
```

---

## 📱 Mobile App Build & Deploy

### Prerequisites

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure Project**:
   ```bash
   eas build:configure
   ```

---

### Development Build (Internal Testing)

Build for internal testing on devices:

```bash
# iOS Development Build
npm run build:dev:ios

# Android Development Build
npm run build:dev:android

# Both platforms
npm run build:dev
```

---

### Staging Build (TestFlight / Internal Testing)

```bash
# iOS Staging (TestFlight)
npm run build:staging:ios

# Android Staging (Internal Testing)
npm run build:staging:android
```

**Distribute via**:
- **iOS**: TestFlight (automatic from EAS)
- **Android**: Internal testing track in Google Play Console

---

### Production Build (App Store / Play Store)

```bash
# iOS Production
npm run build:prod:ios

# Android Production  
npm run build:prod:android
```

---

### App Store Submission

#### iOS (App Store)

1. **Prerequisites**:
   - Apple Developer Account ($99/year)
   - App Store Connect app created
   - App icons, screenshots, description ready

2. **Build**:
   ```bash
   npm run build:prod:ios
   ```

3. **Submit**:
   ```bash
   npm run submit:prod:ios
   ```

4. **Review in App Store Connect**:
   - Go to https://appstoreconnect.apple.com
   - Complete app information
   - Submit for review

#### Android (Google Play)

1. **Prerequisites**:
   - Google Play Developer Account ($25 one-time)
   - Google Play Console app created
   - App icons, screenshots, description ready

2. **Build**:
   ```bash
   npm run build:prod:android
   ```

3. **Submit**:
   ```bash
   npm run submit:prod:android
   ```

4. **Review in Play Console**:
   - Go to https://play.google.com/console
   - Complete store listing
   - Submit for review

---

## 🔒 Security Checklist

### Backend
- [ ] Environment variables are not hardcoded
- [ ] Database uses strong passwords
- [ ] HTTPS is enabled (SSL certificate)
- [ ] CORS is properly configured
- [ ] API rate limiting is enabled
- [ ] Authentication tokens expire
- [ ] Sensitive data is encrypted

### Mobile App
- [ ] API keys are in environment files (not committed to Git)
- [ ] Production uses `pk_live_` Clerk keys
- [ ] Production uses live Stripe keys
- [ ] Debug logging is disabled in production
- [ ] Analytics is enabled

---

## 🧪 Testing Production Setup

### Test Backend

```bash
# Test production backend is accessible
curl https://api.yourdomain.com/api/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.yourdomain.com/api/sole-users
```

### Test Mobile App

1. **Build staging version**:
   ```bash
   npm run build:staging:ios
   ```

2. **Install on device via TestFlight**

3. **Test all features**:
   - [ ] User login/signup
   - [ ] Photo uploads
   - [ ] Profile viewing
   - [ ] API calls work
   - [ ] No network errors

---

## 📊 Monitoring & Maintenance

### Backend Monitoring

**Railway Dashboard** provides:
- CPU/Memory usage
- Request logs
- Database metrics
- Uptime monitoring

**Add Application Monitoring**:
- Sentry (error tracking)
- DataDog (APM)
- New Relic (performance)

### Mobile App Monitoring

**Already configured**:
- PostHog (analytics) - configured in `.env.production`
- Crash reporting via Expo

---

## 🔄 Update Flow

### Backend Updates

1. **Make changes to Spring Boot code**
2. **Commit and push to Git**:
   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```
3. **Railway auto-deploys** (or deploy manually)

### Mobile App Updates

1. **Make changes to React Native code**
2. **Update version** in `app.config.js`:
   ```javascript
   version: "1.1.0"
   ```
3. **Build and submit**:
   ```bash
   npm run build:prod:ios
   npm run submit:prod:ios
   ```

---

## 🆘 Troubleshooting

### "Network request failed" in production

**Cause**: App can't reach backend

**Solutions**:
1. Check backend is running: `curl https://api.yourdomain.com`
2. Check CORS configuration in Spring Boot
3. Verify SSL certificate is valid
4. Check firewall/security groups allow HTTPS traffic

### "Invalid API key" errors

**Cause**: Wrong environment variables

**Solutions**:
1. Verify `.env.production` has correct keys
2. Rebuild app: `npm run build:prod`
3. Check keys in EAS dashboard

### Build failures

**Cause**: Missing credentials or configuration

**Solutions**:
1. Run `eas credentials` to check
2. Verify Apple Developer/Google Play accounts
3. Check `eas.json` configuration
4. View logs: `eas build:list`

---

## 📞 Support Resources

- **Expo Documentation**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Railway Docs**: https://docs.railway.app
- **Spring Boot Deployment**: https://spring.io/guides/gs/spring-boot-docker/

---

## ✅ Pre-Launch Checklist

### Backend
- [ ] Deployed to production environment
- [ ] Database is backed up regularly
- [ ] HTTPS/SSL is enabled
- [ ] CORS configured for mobile app
- [ ] Environment variables set
- [ ] Health check endpoint works
- [ ] Load testing completed

### Mobile App
- [ ] `.env.production` configured with production URLs
- [ ] Production build tested on physical devices
- [ ] All features working with production backend
- [ ] App icons and splash screens set
- [ ] App Store/Play Store listings complete
- [ ] Screenshots uploaded
- [ ] Privacy policy and terms of service added
- [ ] App submitted for review

---

## 🎉 You're Ready!

Once your backend is deployed and your mobile app is built with the production configuration, your users will connect directly to your cloud backend - no dependency on your MacBook!

**Your production architecture**:
```
User's Phone → Cloud Backend → Cloud Database
     ✅              ✅              ✅
  (Mobile App)  (Railway/Render)  (PostgreSQL)
```

Good luck with your launch! 🚀

