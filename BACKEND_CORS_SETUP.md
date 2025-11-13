# 🔐 Backend CORS Configuration Guide

## Why CORS is Important

Your mobile app runs on `capacitor://localhost` or `file://` protocol, while your backend runs on `https://api.yourdomain.com`. Browsers and mobile apps enforce **Cross-Origin Resource Sharing (CORS)** security, which blocks requests between different origins unless explicitly allowed.

**Without CORS configured**, you'll see:
```
❌ Error: Network request failed
❌ CORS policy: No 'Access-Control-Allow-Origin' header
❌ Blocked by CORS policy
```

---

## 🎯 Solution: Configure CORS in Spring Boot

### Option 1: WebMvcConfigurer (Simple & Recommended)

Create or update your configuration file:

**File**: `src/main/java/com/your/package/config/WebConfig.java`

```java
package com.your.package.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Allowed origins
                .allowedOrigins(
                    "http://localhost:8081",           // Expo development server
                    "http://localhost:3000",           // Web app development
                    "https://yoursoleapp.com",         // Production web app
                    "capacitor://localhost",           // Capacitor mobile apps
                    "ionic://localhost",               // Ionic mobile apps
                    "file://*"                         // Mobile app file protocol
                )
                // Allowed HTTP methods
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                // Allowed headers
                .allowedHeaders("*")
                // Allow credentials (cookies, auth headers)
                .allowCredentials(true)
                // Preflight cache duration (1 hour)
                .maxAge(3600);
    }
}
```

---

### Option 2: Spring Security (If using authentication)

If you're using Spring Security, configure CORS there:

**File**: `src/main/java/com/your/package/config/SecurityConfig.java`

```java
package com.your.package.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())  // Disable CSRF for mobile apps
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            );
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allowed origins
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:8081",           // Expo dev
            "http://localhost:3000",           // Web dev
            "https://yoursoleapp.com",         // Production web
            "capacitor://localhost",           // Mobile apps
            "ionic://localhost",
            "file://*"
        ));
        
        // Allowed methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Allowed headers
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Expose headers (if you return custom headers)
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Total-Count"
        ));
        
        // Allow credentials
        configuration.setAllowCredentials(true);
        
        // Preflight cache
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        
        return source;
    }
}
```

---

### Option 3: Controller-Level CORS

For specific controllers only:

```java
package com.your.package.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sole-users")
@CrossOrigin(
    origins = {
        "http://localhost:8081",
        "https://yoursoleapp.com",
        "capacitor://localhost"
    },
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE},
    allowedHeaders = "*",
    allowCredentials = "true",
    maxAge = 3600
)
public class SoleUserController {
    // Your endpoints here
}
```

---

## 🧪 Testing CORS Configuration

### Test 1: Simple GET Request

```bash
curl -H "Origin: http://localhost:8081" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     https://api.yourdomain.com/api/sole-users
```

**Expected Response Headers**:
```
Access-Control-Allow-Origin: http://localhost:8081
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: true
```

### Test 2: Actual API Call

```bash
curl -H "Origin: http://localhost:8081" \
     -H "Content-Type: application/json" \
     https://api.yourdomain.com/api/sole-users
```

**Should return**: Your data (not a CORS error)

---

## 🔧 Environment-Specific CORS

Use environment variables to configure allowed origins:

**application.properties** or **application.yml**:

```yaml
# application.yml
cors:
  allowed-origins:
    - ${CORS_ORIGIN_1:http://localhost:8081}
    - ${CORS_ORIGIN_2:https://yoursoleapp.com}
    - ${CORS_ORIGIN_3:capacitor://localhost}
```

**Then in WebConfig.java**:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Value("${cors.allowed-origins}")
    private List<String> allowedOrigins;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

**Set environment variables**:
```bash
# Development
CORS_ORIGIN_1=http://localhost:8081
CORS_ORIGIN_2=http://localhost:3000

# Production
CORS_ORIGIN_1=https://yoursoleapp.com
CORS_ORIGIN_2=capacitor://localhost
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "No 'Access-Control-Allow-Origin' header"

**Cause**: CORS not configured or backend not responding

**Solutions**:
1. ✅ Add CORS configuration (see above)
2. ✅ Restart Spring Boot application
3. ✅ Verify endpoint is accessible: `curl https://api.yourdomain.com/api/health`
4. ✅ Check Spring Boot logs for errors

---

### Issue 2: "Credentials flag is true, but Access-Control-Allow-Origin is '*'"

**Cause**: Can't use `allowedOrigins("*")` with `allowCredentials(true)`

**Solution**: Specify exact origins:
```java
.allowedOrigins(
    "http://localhost:8081",
    "https://yoursoleapp.com"
)  // ✅ Specific origins
.allowCredentials(true)
```

**NOT**:
```java
.allowedOrigins("*")  // ❌ Doesn't work with credentials
.allowCredentials(true)
```

---

### Issue 3: Preflight OPTIONS request fails

**Cause**: Backend doesn't handle OPTIONS method

**Solution**: Ensure OPTIONS is in allowed methods:
```java
.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
//                                                ^^^^^^^^ Important!
```

---

### Issue 4: Works locally but fails in production

**Cause**: Production URL not in allowed origins

**Solution**: Add production URLs:
```java
.allowedOrigins(
    "http://localhost:8081",           // ✅ Development
    "https://api.yoursoleapp.com",     // ✅ Production API
    "https://yoursoleapp.com",         // ✅ Production web
    "capacitor://localhost"            // ✅ Mobile apps
)
```

---

## 📋 Checklist for Production

Before deploying to production:

- [ ] CORS configuration added to Spring Boot
- [ ] Production domain added to allowed origins
- [ ] `capacitor://localhost` added for mobile apps
- [ ] OPTIONS method included in allowed methods
- [ ] `allowCredentials(true)` if using authentication
- [ ] Tested with actual mobile app
- [ ] Backend restarted after configuration changes
- [ ] HTTPS enabled (not HTTP)
- [ ] Firewall allows HTTPS traffic (port 443)

---

## 🎯 Complete Production Example

Here's a complete, production-ready CORS configuration:

```java
package com.sole.app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Value("${app.cors.allowed-origins:http://localhost:8081,https://yoursoleapp.com}")
    private String[] allowedOrigins;
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Dynamic allowed origins from properties
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        
        // Also allow mobile app protocols
        configuration.addAllowedOriginPattern("capacitor://*");
        configuration.addAllowedOriginPattern("ionic://*");
        
        // HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Headers
        configuration.setAllowedHeaders(List.of("*"));
        
        // Expose custom headers
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "X-Total-Count", "X-Request-Id"
        ));
        
        // Credentials
        configuration.setAllowCredentials(true);
        
        // Preflight cache (1 hour)
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
```

**application.properties**:
```properties
# Development
app.cors.allowed-origins=http://localhost:8081,http://localhost:3000

# Production (set via environment variable)
# app.cors.allowed-origins=https://api.yoursoleapp.com,https://yoursoleapp.com,capacitor://localhost
```

---

## 📞 Still Having Issues?

### Debug Steps

1. **Check Spring Boot logs**:
   ```bash
   # Look for CORS errors
   grep -i "cors" application.log
   ```

2. **Enable CORS debug logging**:
   ```properties
   # application.properties
   logging.level.org.springframework.web.cors=DEBUG
   ```

3. **Test with browser DevTools**:
   - Open browser console
   - Look for CORS errors
   - Check "Network" tab for OPTIONS requests

4. **Use CORS tester tool**:
   - https://www.test-cors.org/
   - Enter your API URL
   - Check response headers

---

## ✅ Success Indicators

You know CORS is working when:

- ✅ Mobile app makes API calls without "Network request failed"
- ✅ Browser console shows no CORS errors
- ✅ OPTIONS preflight requests return 200
- ✅ Response headers include `Access-Control-Allow-Origin`
- ✅ Authentication/credentials work correctly

---

## 🎉 You're Done!

Your backend is now configured to accept requests from your mobile app. Update your production `.env` file with your backend URL and rebuild your app!

```bash
# In mobile app .env.production
EXPO_PUBLIC_API_URL=https://api.yourdomain.com

# Rebuild app
npm run build:prod
```

Your app will now connect directly to your cloud backend! 🚀

