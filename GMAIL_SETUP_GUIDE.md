# Gmail Configuration for Password Reset

## ⚠️ IMPORTANT: Follow These Steps Exactly

### Step 1: Enable 2-Factor Authentication (2FA)

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left menu
3. Find **2-Step Verification** (also called 2FA)
4. Click on it and follow the setup process
5. You'll need your phone to verify

### Step 2: Generate App-Specific Password

**After enabling 2FA:**

1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords

2. You may need to sign in again

3. Click **Select app** dropdown:
   - Choose **Mail**

4. Click **Select device** dropdown:
   - Choose **Other (Custom name)**
   - Type: **BudgetWise App**

5. Click **Generate**

6. Google will show you a 16-character password like: `abcd efgh ijkl mnop`

7. **Copy this password** (remove spaces: `abcdefghijklmnop`)

### Step 3: Update application.properties

Open: `backend/src/main/resources/application.properties`

Replace this line:
```properties
spring.mail.password=your-app-specific-password-here
```

With:
```properties
spring.mail.password=abcdefghijklmnop
```
(Use your actual 16-character password, no spaces)

### Step 4: Verify Email Address

The email is already set to: `vinuhashini1711@gmail.com`

If you want to use a different Gmail account, update:
```properties
spring.mail.username=your-other-email@gmail.com
```

### Step 5: Restart Backend

After updating the password:

1. Stop the backend (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   cd backend
   mvnw spring-boot:run
   ```

### Step 6: Test Password Reset

1. Go to http://localhost:3000/login
2. Click **"Forgot Password?"**
3. Enter your registered email
4. Check your inbox (and spam folder)
5. Click the reset link in the email

---

## Troubleshooting

### ❌ "Failed to send mail" Error

**Possible causes:**

1. **2FA Not Enabled**
   - Solution: Enable 2-Step Verification first

2. **Using Regular Password Instead of App Password**
   - Solution: Generate app-specific password from link above

3. **Spaces in App Password**
   - Solution: Remove all spaces from the 16-character password

4. **Wrong Email Format**
   - Solution: Verify vinuhashini1711@gmail.com is correct

5. **Firewall/Antivirus Blocking**
   - Solution: Temporarily disable and test

### ✅ How to Know It's Working

Backend logs should show:
```
Password reset email sent successfully to: user@example.com
```

If you see errors like:
```
Failed to send password reset email
javax.mail.AuthenticationFailedException
```
This means the app password is wrong or 2FA is not enabled.

---

## Quick Reference

**Gmail SMTP Settings:**
- Host: `smtp.gmail.com`
- Port: `587`
- Security: STARTTLS
- Authentication: Required

**Current Configuration:**
- Email: vinuhashini1711@gmail.com
- Password: [Generate from https://myaccount.google.com/apppasswords]

---

## Alternative: Use Different Email Provider

If Gmail doesn't work, you can use other providers:

### Outlook/Hotmail
```properties
spring.mail.host=smtp.office365.com
spring.mail.port=587
spring.mail.username=your-email@outlook.com
spring.mail.password=your-password
```

### Yahoo
```properties
spring.mail.host=smtp.mail.yahoo.com
spring.mail.port=587
spring.mail.username=your-email@yahoo.com
spring.mail.password=your-app-password
```

---

## Need Help?

1. Check backend console for detailed error messages
2. Verify 2FA is enabled: https://myaccount.google.com/security
3. Verify app password is generated: https://myaccount.google.com/apppasswords
4. Make sure no spaces in the password in application.properties
5. Restart backend after changing configuration

---

**Remember:** 
- ✅ Enable 2FA FIRST
- ✅ Generate App Password SECOND
- ✅ Update application.properties THIRD
- ✅ Restart backend FOURTH
