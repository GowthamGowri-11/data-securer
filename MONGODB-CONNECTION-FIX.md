# MongoDB Connection Issue - Fix Guide

## Current Problem ❌

**Error**: "Server selection timeout: No available servers"  
**Cause**: Cannot connect to MongoDB Atlas from your network

---

## Quick Fixes (Try These First)

### Fix 1: Add Your IP to MongoDB Atlas Whitelist

1. Go to https://cloud.mongodb.com
2. Log in to your account
3. Select your cluster (Cluster0)
4. Click "Network Access" in the left sidebar
5. Click "Add IP Address"
6. Choose one of these options:
   - **Option A**: Click "Add Current IP Address" (recommended for testing)
   - **Option B**: Click "Allow Access from Anywhere" (0.0.0.0/0) - Less secure but works everywhere
7. Click "Confirm"
8. Wait 1-2 minutes for changes to take effect
9. Try logging in again

### Fix 2: Check Your Network/Firewall

Your network might be blocking MongoDB Atlas connections (port 27017).

**If you're on:**
- **Corporate/School Network**: Ask IT to allow MongoDB Atlas connections
- **Home Network**: Check router firewall settings
- **VPN**: Try disconnecting VPN temporarily

### Fix 3: Use Alternative Connection String

Try updating your DATABASE_URL in `.env` with connection options:

```env
DATABASE_URL="mongodb+srv://gowtha:11_Gowtham_11@cluster0.rc4zgi4.mongodb.net/tamper-detection?retryWrites=true&w=majority&appName=Cluster0&connectTimeoutMS=10000&socketTimeoutMS=10000"
```

---

## Detailed Steps

### Step 1: Verify MongoDB Atlas Configuration

1. **Login to MongoDB Atlas**
   - URL: https://cloud.mongodb.com
   - Use your MongoDB account credentials

2. **Check Cluster Status**
   - Go to "Database" section
   - Verify your cluster (Cluster0) is running
   - Status should be green/active

3. **Check Network Access**
   - Click "Network Access" in left menu
   - You should see IP addresses that are allowed
   - If empty or your IP is not listed, add it

4. **Check Database User**
   - Click "Database Access" in left menu
   - Verify user "gowtha" exists
   - Verify password is correct: `11_Gowtham_11`
   - User should have "Read and write to any database" permission

### Step 2: Test Connection from Your Computer

**Option A: Using MongoDB Compass (GUI Tool)**
1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Install and open it
3. Paste your connection string:
   ```
   mongodb+srv://gowtha:11_Gowtham_11@cluster0.rc4zgi4.mongodb.net/tamper-detection
   ```
4. Click "Connect"
5. If it connects, your network is fine
6. If it fails, check network/firewall

**Option B: Using Command Line**
```bash
# Install MongoDB Shell (if not installed)
# Then test connection:
mongosh "mongodb+srv://gowtha:11_Gowtham_11@cluster0.rc4zgi4.mongodb.net/tamper-detection"
```

### Step 3: Update IP Whitelist (Most Common Fix)

**Allow Your Current IP:**
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Click "Add Current IP Address"
4. Click "Confirm"
5. Wait 1-2 minutes

**OR Allow All IPs (For Testing Only):**
1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Enter: `0.0.0.0/0`
4. Add comment: "Allow all (temporary for testing)"
5. Click "Confirm"
6. Wait 1-2 minutes

⚠️ **Security Note**: Allowing all IPs (0.0.0.0/0) is less secure. Use only for testing, then restrict to specific IPs for production.

### Step 4: Check Firewall Settings

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Check if MongoDB connections (port 27017) are blocked
4. Create an outbound rule to allow MongoDB if needed

**Antivirus Software:**
- Some antivirus software blocks database connections
- Temporarily disable to test
- Add exception for MongoDB if needed

### Step 5: Try Alternative Connection

If MongoDB Atlas is completely blocked, you have these options:

**Option A: Use Local MongoDB**
1. Install MongoDB locally
2. Update DATABASE_URL to: `mongodb://localhost:27017/tamper-detection`
3. Restart server

**Option B: Use Different MongoDB Provider**
- Try MongoDB Atlas from different network
- Use mobile hotspot temporarily
- Use VPN to different location

---

## After Fixing Connection

Once MongoDB connection works:

1. **Restart the development server:**
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Try Google Sign-In again:**
   - Go to http://localhost:3000/login
   - Click "Sign in with Google"
   - Should work now!

3. **Verify user was created:**
   - Check MongoDB Atlas → Browse Collections
   - Look in `users` collection
   - Your Google account should be there

---

## Testing MongoDB Connection

Run this command to test:
```bash
node test-db-connection.js
```

**Expected Output (Success):**
```
Testing MongoDB connection...
✅ Connection successful! Found X users in database.
```

**Expected Output (Failure):**
```
Testing MongoDB connection...
❌ Connection failed: Server selection timeout
```

---

## Common Error Messages

### "Server selection timeout"
**Cause**: Cannot reach MongoDB Atlas servers  
**Fix**: Add your IP to whitelist, check firewall

### "Authentication failed"
**Cause**: Wrong username or password  
**Fix**: Verify credentials in MongoDB Atlas → Database Access

### "Network error"
**Cause**: Network/firewall blocking connection  
**Fix**: Check firewall, try different network

### "SSL/TLS error"
**Cause**: SSL certificate issue  
**Fix**: Update connection string with `&tls=true&tlsAllowInvalidCertificates=true`

---

## Quick Checklist

Before trying to login again, verify:

- [ ] MongoDB Atlas cluster is running (green status)
- [ ] Your IP address is in the whitelist
- [ ] Database user "gowtha" exists with correct password
- [ ] No firewall blocking port 27017
- [ ] Connection string in `.env` is correct
- [ ] Development server restarted after changes

---

## Alternative: Use Mock Data (Temporary)

If you can't fix MongoDB connection right now, I can create a temporary mock authentication that stores users in memory. This will let you test the Google OAuth flow without database.

Would you like me to create this temporary solution?

---

## Need Help?

If none of these fixes work, please provide:

1. **Screenshot of MongoDB Atlas Network Access page**
2. **Output of**: `node test-db-connection.js`
3. **Your current IP address** (visit https://whatismyipaddress.com)
4. **Network type** (home, school, corporate, mobile hotspot)

---

## Status

**Current Issue**: MongoDB Atlas connection timeout  
**Most Likely Cause**: IP address not whitelisted in MongoDB Atlas  
**Recommended Fix**: Add your IP to MongoDB Atlas Network Access  
**Time to Fix**: 2-3 minutes

