# 🚀 Quick Start Guide - Production-Ready Setup

## ✅ What's Been Set Up

Your Sole app is now configured with **industry-standard multi-environment setup**:

- ✅ Development, Staging, and Production environments
- ✅ Environment-specific configuration files
- ✅ EAS Build profiles for app distribution
- ✅ Cloud deployment ready
- ✅ Direct backend access (no localhost dependency)

---

## 📁 New Files Created

### Environment Configuration
- `.env.development` - Local development settings
- `.env.staging` - Pre-production testing settings
- `.env.production` - Live app settings

### Build Configuration
- `eas.json` - Expo Application Services build profiles
- `app.config.js` - Dynamic environment loading (updated)
- `config/environment.ts` - Runtime environment utilities

### Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `BACKEND_CORS_SETUP.md` - Backend CORS configuration guide
- `QUICK_START.md` - This file

---

## 🎯 Next Steps (Follow in Order)

### Step 1: Test Locally (Right Now)

Your app should work locally with your Spring Boot backend:

```bash
# Make sure your Spring Boot backend is running on port 8080
# Then start the mobile app:
npm run start:dev
```

**Expected logs**:
```
📦 Loading environment from: .env.development
🌍 Environment Configuration:
  Current: development
  API URL: http://localhost:8080/api
  Platform: ios (or android)
```

Press `i` for iOS simulator or `a` for Android emulator.

---

### Step 2: Deploy Backend to Cloud (When Ready)

**Recommended: Railway** (easiest, $5/mo)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to your Spring Boot backend directory
cd /path/to/your/spring-boot-backend

# Login and deploy
railway login
railway init
railway up
```

Railway will give you a URL like: `https://your-app.railway.app`

**See full instructions**: `DEPLOYMENT_GUIDE.md`

---

### Step 3: Update Production Environment

After deploying your backend, update `.env.production`:

```bash
# Edit .env.production (use your actual domain)
EXPO_PUBLIC_API_URL=https://your-app.railway.app
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
```

---

### Step 4: Build Production App

```bash
# Install EAS CLI (if not already)
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
npm run build:prod:ios

# Build for Android
npm run build:prod:android
```

---

### Step 5: Submit to App Stores

```bash
# Submit to App Store (iOS)
npm run submit:prod:ios

# Submit to Play Store (Android)
npm run submit:prod:android
```

---

## 🔄 Development Workflow

### Local Development (Daily Work)

```bash
# Start in development mode
npm run start:dev

# This uses .env.development (localhost:8080)
```

### Testing Staging Environment

```bash
# Start in staging mode
npm run start:staging

# This uses .env.staging (staging-api.yourdomain.com)
```

### Building for Production

```bash
# Build production app
npm run build:prod:ios
npm run build:prod:android

# This uses .env.production (api.yourdomain.com)
```

---

## 📱 Available NPM Scripts

### Development
- `npm run start:dev` - Start in development mode
- `npm run start:staging` - Start in staging mode  
- `npm run start:prod` - Start in production mode

### Building
- `npm run build:dev:ios` - Build iOS dev (internal testing)
- `npm run build:dev:android` - Build Android dev
- `npm run build:staging:ios` - Build iOS staging (TestFlight)
- `npm run build:staging:android` - Build Android staging
- `npm run build:prod:ios` - Build iOS production (App Store)
- `npm run build:prod:android` - Build Android production (Play Store)

### Submitting
- `npm run submit:prod:ios` - Submit to App Store
- `npm run submit:prod:android` - Submit to Play Store

---

## 🔍 Verify Your Setup

### Check Environment Configuration

Run this in your app to verify:

```typescript
import { ENV, logEnvironmentInfo } from '~/config/environment';

// In any component or screen
logEnvironmentInfo();
```

**Expected output**:
```
🌍 Environment Configuration:
  Current: development
  API URL: http://localhost:8080/api
  App Version: 1.0.0
  Platform: ios
  Device Type: Simulator
  Debug Logs: Enabled
  Analytics: Disabled
```

---

## ⚠️ Important Notes

### Environment Variables in Mobile Apps

**Mobile apps bake environment variables at BUILD TIME**, not runtime!

This means:
- ✅ Change `.env.production` → Must rebuild app
- ❌ Can't change API URL without rebuilding
- ✅ Each build (dev/staging/prod) gets its own config

### Testing on Physical Devices (Development)

If testing on a physical iPhone/Android during development:

1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example output: 192.168.1.100
   ```

2. Update `.env.development`:
   ```bash
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
   ```

3. Restart Expo:
   ```bash
   npm run start:dev
   ```

4. **Make sure your Mac and phone are on the same WiFi network**

---

## 🆘 Troubleshooting

### "Network request failed"

**Check**:
1. ✅ Backend is running: `curl http://localhost:8080/api/health`
2. ✅ Environment loaded: Check console for "📦 Loading environment from"
3. ✅ Expo cache cleared: `npm run start:dev` (includes --clear flag)

### "CORS error"

**Backend needs CORS configuration**. See: `BACKEND_CORS_SETUP.md`

Quick fix for Spring Boot:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:8081", "https://yoursoleapp.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### Build fails

```bash
# Check EAS credentials
eas credentials

# View build logs
eas build:list
```

---

## 📚 Documentation

- **`DEPLOYMENT_GUIDE.md`** - Complete production deployment guide
- **`BACKEND_CORS_SETUP.md`** - Fix backend CORS configuration
- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/

---

## 🎉 You're All Set!

Your app is now configured for:
- ✅ Local development with localhost
- ✅ Staging environment for testing
- ✅ Production deployment with cloud backend
- ✅ Direct backend access (no MacBook dependency)

**Current Status**:
```
Development: ✅ Ready (localhost:8080)
Staging:     ⏳ Pending (deploy backend first)
Production:  ⏳ Pending (deploy backend first)
```

**Next Action**: Deploy your Spring Boot backend to Railway/Render/Fly.io

See `DEPLOYMENT_GUIDE.md` for detailed instructions! 🚀

