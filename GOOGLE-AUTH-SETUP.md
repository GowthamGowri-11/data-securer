# Google OAuth Authentication Setup Guide

## Overview
The login system has been updated to support Google OAuth 2.0 authentication alongside the traditional username/password login.

## Features Implemented
✅ Google Sign-In button on login page
✅ Automatic user creation for new Google users
✅ Profile picture display in navbar
✅ Secure token verification
✅ Maintains existing UI design
✅ Backward compatible with username/password login

## Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Add authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Click "Create"
   - Copy the Client ID

### Step 2: Configure Environment Variables

1. Open your `.env` file
2. Add the following line with your Google Client ID:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
```

Example:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
```

### Step 3: Restart the Development Server

```bash
npm run dev
```

## How It Works

### User Flow

1. **New Google User:**
   - User clicks "Sign in with Google"
   - Google authentication popup appears
   - User selects their Google account
   - System verifies the token
   - New user account is created automatically
   - User is redirected to dashboard

2. **Existing Google User:**
   - User clicks "Sign in with Google"
   - Google authentication popup appears
   - User selects their Google account
   - System verifies the token
   - User is logged in with existing account
   - User is redirected to dashboard

3. **Traditional Login:**
   - Still works for existing users (admin/admin123)
   - Username/password form below Google button

### Security Features

- ✅ Token verification using Google's API
- ✅ Email verification check
- ✅ Client ID validation
- ✅ Secure session storage
- ✅ 24-hour session expiry
- ✅ No password storage for Google users

### Database Schema

Google users are stored with:
- `username`: Generated from email (e.g., "john_1234")
- `email`: Google account email
- `password`: Empty string (not used)
- `role`: "user" (default)
- Profile picture URL stored in session

## API Endpoints

### POST /api/auth/google
Handles Google OAuth authentication

**Request:**
```json
{
  "credential": "google_id_token"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "username": "john_1234",
    "email": "john@gmail.com",
    "role": "user",
    "picture": "https://..."
  }
}
```

## UI Changes

### Login Page
- Google Sign-In button at the top
- Divider with "Or continue with username"
- Traditional login form below
- Maintains existing design and styling

### Navbar
- Shows Google profile picture if available
- Falls back to icon for non-Google users
- Displays username and role

## Testing

### Test Google Login:
1. Navigate to http://localhost:3000/login
2. Click "Sign in with Google"
3. Select your Google account
4. Verify redirect to dashboard
5. Check navbar shows your profile picture

### Test Traditional Login:
1. Navigate to http://localhost:3000/login
2. Scroll to username/password form
3. Enter: admin / admin123
4. Verify redirect to dashboard

## Troubleshooting

### "Google Sign-In button not appearing"
- Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env`
- Restart the development server
- Check browser console for errors

### "Authentication failed"
- Verify Client ID is correct
- Check that authorized origins are configured in Google Console
- Ensure Google+ API is enabled

### "Email not verified"
- User must have a verified Google email
- Ask user to verify their email in Google account settings

## Production Deployment

1. Update Google Console with production domain
2. Add production URL to authorized origins
3. Update `.env` with production Client ID
4. Deploy application

## Security Notes

- Never commit `.env` file to version control
- Keep Google Client ID secure
- Use HTTPS in production
- Regularly rotate credentials
- Monitor authentication logs

## Support

For issues or questions:
1. Check Google Cloud Console for API status
2. Verify environment variables are set correctly
3. Check browser console for JavaScript errors
4. Review server logs for authentication errors
