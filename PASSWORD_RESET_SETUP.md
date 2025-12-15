# Password Reset Email Setup Guide

## Overview
The forgot password functionality has been fully implemented with email integration. Users can request a password reset, receive an email with a secure link, and set a new password.

## Backend Implementation ✅

### 1. Dependencies Added
- `spring-boot-starter-mail` in pom.xml

### 2. Configuration Required
In `backend/src/main/resources/application.properties`, you need to configure:

```properties
# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-specific-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Application Configuration
app.name=BudgetWise
app.support-email=support@budgetwise.com
app.base-url=http://localhost:3000
```

### 3. Gmail Setup Steps

#### Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

#### Create App-Specific Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "BudgetWise App"
4. Copy the generated 16-character password
5. Use this password in `spring.mail.password`

### 4. Files Created/Modified

**Backend:**
- `model/PasswordResetToken.java` - Entity for storing reset tokens
- `repository/PasswordResetTokenRepository.java` - Data access layer
- `service/EmailService.java` - Email sending functionality
- `service/PasswordResetService.java` - Business logic
- `controller/AuthController.java` - Added `/api/auth/forgot-password` and `/api/auth/reset-password` endpoints

**Frontend:**
- `pages/Login.js` - Updated forgot password modal to call real API
- `pages/ResetPassword.js` - New page for resetting password
- `styles/ResetPassword.css` - Styling for reset password page
- `App.js` - Added route for /reset-password

## How It Works

### 1. User Requests Password Reset
- User clicks "Forgot Password?" on login page
- Enters their email address
- Backend generates a unique token (UUID)
- Token is stored in database with 1-hour expiration
- Email is sent with reset link

### 2. Reset Link Format
```
http://localhost:3000/reset-password?token=<unique-token>
```

### 3. User Resets Password
- User clicks link in email
- Enters new password
- Backend validates token (not expired, not used)
- Password is encrypted with BCrypt
- Token is marked as used
- User is redirected to login

## Security Features

✅ **Token Expiration:** Tokens expire after 1 hour
✅ **One-Time Use:** Tokens can only be used once
✅ **Secure Storage:** Passwords encrypted with BCrypt
✅ **Email Verification:** Only registered emails can reset
✅ **Token Cleanup:** Expired tokens are automatically cleaned

## Testing the Feature

### 1. Start Backend
```bash
cd backend
mvnw spring-boot:run
```

### 2. Start Frontend
```bash
cd frontend
npm start
```

### 3. Test Flow
1. Go to http://localhost:3000/login
2. Click "Forgot Password?"
3. Enter a registered user's email
4. Check email inbox for reset link
5. Click the link in email
6. Enter new password
7. Login with new password

## Email Template

The email includes:
- Professional gradient header
- User's username
- Reset button (expires in 1 hour)
- Security warning
- Support contact information

## API Endpoints

### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "unique-token-from-email",
  "newPassword": "newSecurePassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Database Schema

A new table `password_reset_tokens` is created automatically:
- `id` (bigint, primary key)
- `token` (varchar, unique)
- `user_id` (bigint, foreign key)
- `expiry_date` (timestamp)
- `used` (boolean)
- `created_at` (timestamp)

## Troubleshooting

### Email Not Sending
- Check Gmail credentials are correct
- Verify 2FA is enabled
- Use app-specific password, not regular password
- Check spam/junk folder

### Token Errors
- Ensure token hasn't expired (1 hour limit)
- Verify token wasn't already used
- Check database for token entry

### Database Issues
- Make sure PostgreSQL is running
- Verify database connection in application.properties
- Check if table was created

## Production Deployment

Before deploying to production:
1. Use environment variables for email credentials
2. Update `app.base-url` to production URL
3. Use a professional email service (SendGrid, AWS SES, etc.)
4. Enable SSL/TLS
5. Add rate limiting to prevent abuse
6. Consider shorter token expiration (15-30 minutes)

## Support

For issues or questions:
- Email: support@budgetwise.com
- Check application logs for error details
