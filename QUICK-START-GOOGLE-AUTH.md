# Quick Start: Google Authentication

## ⚡ 3-Minute Setup

### 1. Get Google Client ID (2 minutes)

1. Visit: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Authorized JavaScript origins: `http://localhost:3000`
5. Click "Create" and copy the Client ID

### 2. Add to Environment (30 seconds)

Open `.env` file and add:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com"
```

### 3. Restart Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## ✅ Done!

Visit http://localhost:3000/login and you'll see:
- **Google Sign-In button** at the top
- Traditional username/password login below

## 🧪 Test It

1. Click "Sign in with Google"
2. Select your Google account
3. You'll be redirected to dashboard
4. Your profile picture appears in navbar

## 🔑 Existing Login Still Works

- Username: `admin`
- Password: `admin123`

## 📝 What Changed

- ✅ Google OAuth added
- ✅ Auto-creates users from Gmail
- ✅ Shows profile pictures
- ✅ Secure token verification
- ✅ Same UI design maintained
- ✅ Old login method still works

## 🚨 Important

- The Google button won't appear until you add the Client ID
- Make sure to restart the server after adding the Client ID
- For production, add your production domain to Google Console

## Need Help?

See `GOOGLE-AUTH-SETUP.md` for detailed instructions.
