# Google OAuth Testing Guide

## Current Status ✅

All code changes have been applied successfully:
- ✅ Login page updated with useCallback and null checks
- ✅ Register page updated with useCallback and null checks
- ✅ Enhanced error logging added
- ✅ No TypeScript compilation errors
- ✅ Server is running on port 3000

---

## How to Test Google OAuth

### Step 1: Open the Login Page
1. Open your browser
2. Navigate to: `http://localhost:3000/login`
3. You should see:
   - "Welcome Back" heading
   - Google Sign-In button
   - "Secure Authentication" message

### Step 2: Check Browser Console
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to the Console tab
3. Look for these messages:
   - ✅ "Initializing Google Sign-In..."
   - ✅ "Google Sign-In button rendered successfully"
   - ❌ Any error messages (report these)

### Step 3: Test Google Sign-In
1. Click the "Sign in with Google" button
2. A Google popup should appear
3. Select your Google account
4. Grant permissions if asked
5. You should be redirected to `/dashboard`

### Step 4: Verify User Data
After successful login, check:
1. **Navbar**: Your Google profile picture should appear
2. **Username**: Should show in the navbar
3. **MongoDB**: Check the `users` collection for your entry

---

## Expected Behavior

### ✅ Success Indicators:
- Google Sign-In button appears on page load
- Button is clickable and styled correctly
- Google popup opens when clicked
- User is redirected to dashboard after authentication
- Profile picture appears in navbar
- User data is stored in MongoDB

### ❌ Error Indicators:
- Button doesn't appear
- "Authentication system not ready" error
- "Google Sign-In configuration error" message
- Console errors about undefined properties
- Redirect doesn't happen

---

## Common Issues and Solutions

### Issue 1: Google Button Doesn't Appear
**Symptoms:**
- Empty space where button should be
- No console logs about initialization

**Solutions:**
1. Check `.env` file has `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. Restart the dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache and reload
4. Check browser console for errors

### Issue 2: "Authentication System Not Ready"
**Symptoms:**
- Error message appears when clicking button
- Console shows auth context is undefined

**Solutions:**
1. Check that `AuthProvider` wraps the app in `app/layout.tsx`
2. Verify no circular dependencies in imports
3. Check browser console for initialization errors

### Issue 3: Google Popup Doesn't Open
**Symptoms:**
- Button clicks but nothing happens
- No popup window appears

**Solutions:**
1. Check if popup blockers are enabled
2. Verify Google Client ID is correct
3. Check browser console for Google API errors
4. Ensure you're using HTTPS or localhost (not IP address)

### Issue 4: "Authentication Failed" After Login
**Symptoms:**
- Google popup works
- User selects account
- Error message appears instead of redirect

**Solutions:**
1. Check MongoDB connection in `.env`
2. Verify API route `/api/auth/google` is working
3. Check server logs for database errors
4. Verify Google token verification is working

---

## Debugging Steps

### 1. Check Environment Variables
```bash
# In PowerShell
Get-Content .env | Select-String "GOOGLE"
```

Expected output:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID="179389585401-s2t8apthee3jqjemrmjrrcjmk9mdr3il.apps.googleusercontent.com"
```

### 2. Check Server Logs
Look at the terminal running `npm run dev` for:
- Compilation errors
- Runtime errors
- Database connection issues
- API route errors

### 3. Check Browser Console
Open DevTools Console and look for:
- Google Sign-In initialization messages
- Error messages
- Network request failures
- JavaScript errors

### 4. Check Network Tab
In DevTools Network tab:
1. Click Google Sign-In button
2. Look for POST request to `/api/auth/google`
3. Check response status (should be 200)
4. Verify response contains user data

### 5. Test API Route Directly
You can test the Google OAuth API route:
1. Get a Google ID token (from successful login attempt)
2. Use a tool like Postman or curl:
```bash
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"YOUR_GOOGLE_TOKEN_HERE"}'
```

---

## What to Report

If you encounter issues, please provide:

1. **Browser Console Output:**
   - Copy all error messages
   - Include any warnings
   - Note any missing logs

2. **Server Logs:**
   - Copy relevant error messages
   - Include compilation errors
   - Note any database connection issues

3. **Screenshots:**
   - Login page appearance
   - Error messages
   - Network tab showing failed requests

4. **Steps to Reproduce:**
   - What you clicked
   - What you expected
   - What actually happened

---

## MongoDB Verification

After a successful login, verify data in MongoDB:

### Using MongoDB Atlas:
1. Go to https://cloud.mongodb.com
2. Navigate to your cluster
3. Click "Browse Collections"
4. Find the `users` collection
5. Look for your user entry:
```json
{
  "_id": "ObjectId(...)",
  "username": "yourname_1234",
  "email": "your@gmail.com",
  "password": "",
  "role": "user",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Using Prisma Studio:
```bash
npm run db:studio
```
Then browse to the Users table.

---

## Next Steps After Successful Test

Once Google OAuth is working:

1. ✅ Test with multiple Google accounts
2. ✅ Verify user data isolation (each user sees only their data)
3. ✅ Test logout functionality
4. ✅ Test session persistence (refresh page)
5. ✅ Test session expiry (after 24 hours)
6. ✅ Test admin role (manually set in database)

---

## Production Checklist

Before deploying to production:

- [ ] Update Google Console with production domain
- [ ] Add production URL to authorized origins
- [ ] Verify HTTPS is enabled
- [ ] Test with production database
- [ ] Test with multiple users
- [ ] Verify error handling
- [ ] Check security headers
- [ ] Test session management
- [ ] Verify data isolation
- [ ] Test logout flow

---

## Support Resources

- **Google OAuth Documentation**: https://developers.google.com/identity/gsi/web
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **MongoDB Atlas**: https://cloud.mongodb.com

---

## Current Configuration

**Google Client ID**: `179389585401-s2t8apthee3jqjemrmjrrcjmk9mdr3il.apps.googleusercontent.com`

**Server**: Running on `http://localhost:3000`

**Database**: MongoDB Atlas (configured in `.env`)

**Status**: ✅ Ready for testing

---

## Quick Test Command

Open browser and run in console:
```javascript
// Check if Google API is loaded
console.log('Google API loaded:', typeof window.google !== 'undefined');

// Check if auth context is available
console.log('Auth context available:', typeof useAuth !== 'undefined');

// Check environment variable
console.log('Client ID configured:', !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

---

**Last Updated**: Debugging Session
**Status**: Ready for testing ✅
