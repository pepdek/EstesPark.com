# Google Authentication Setup Guide

## Step-by-Step Firebase Configuration

### 1. Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `estespark-83a46`
3. **Navigate to Authentication** → **Sign-in method**

### 2. Enable Google Sign-in

1. **Click on "Google"** in the Sign-in providers list
2. **Enable the toggle** at the top
3. **Set Project support email** (use your email address)
4. **Web SDK configuration** should auto-populate
5. **Click "Save"**

### 3. Configure Authorized Domains

1. **Still in Authentication** → **Sign-in method**
2. **Scroll down to "Authorized domains"**
3. **Add these domains**:
   - `localhost` (for local development)
   - Your Vercel domain (e.g., `your-project-name.vercel.app`)
   - Any custom domains you plan to use

4. **Click "Add domain"** for each
5. **Save changes**

### 4. Google Cloud Console (if needed)

If you're still having issues, you might need to configure the Google Cloud Console:

1. **Go to**: https://console.cloud.google.com/
2. **Select your Firebase project**
3. **Navigate to**: APIs & Services → Credentials
4. **Find your OAuth 2.0 Client ID**
5. **Edit the OAuth client**
6. **Add Authorized JavaScript origins**:
   - `https://your-domain.vercel.app`
   - `http://localhost:3000` (for local testing)
7. **Add Authorized redirect URIs**:
   - `https://your-domain.vercel.app/__/auth/handler`
   - `https://estespark-83a46.firebaseapp.com/__/auth/handler`

### 5. Common Issues & Solutions

#### Issue: "auth/unauthorized-domain"
**Solution**: Add your domain to Firebase authorized domains (step 3 above)

#### Issue: "auth/popup-blocked"
**Solution**: User needs to allow popups in their browser

#### Issue: "auth/operation-not-allowed"
**Solution**: Google sign-in method is not enabled in Firebase Console

#### Issue: "auth/popup-closed-by-user"
**Solution**: User closed the popup - this is normal behavior

### 6. Testing Steps

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Try signing in with Google**
4. **Check for error messages** in console
5. **Look for specific error codes** mentioned above

### 7. Verification Checklist

- [ ] Google sign-in method is **enabled** in Firebase Console
- [ ] Project support email is **set**
- [ ] Your domain is in **authorized domains**
- [ ] No errors in browser **console**
- [ ] Popup is **not blocked** by browser
- [ ] Firebase project ID matches your config

### 8. Domain Configuration Example

For a Vercel deployment at `estespark-ai.vercel.app`:

**Firebase Authorized Domains:**
```
localhost
estespark-ai.vercel.app
```

**Google Cloud OAuth Origins:**
```
https://estespark-ai.vercel.app
http://localhost:3000
```

**Google Cloud Redirect URIs:**
```
https://estespark-ai.vercel.app/__/auth/handler
https://estespark-83a46.firebaseapp.com/__/auth/handler
```

### 9. Testing Commands

You can test the authentication in the browser console:

```javascript
// Test Firebase connection
console.log('Firebase Auth:', firebase.auth());

// Test Google provider
console.log('Google Provider:', googleProvider);

// Manual sign-in test
signInWithPopup(auth, googleProvider)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

### 10. Need Help?

If you're still experiencing issues:

1. **Check the browser console** for specific error messages
2. **Verify all domains** are correctly added
3. **Try incognito mode** to rule out browser cache issues
4. **Test on different browsers**
5. **Double-check Firebase project configuration**

The enhanced error handling in the code will now provide more specific error messages to help diagnose issues!