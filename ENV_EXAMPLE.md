# VebTask Multi-Tenant Environment Variables

## Required Environment Variables

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# Application URLs  
VITE_APP_URL="https://vebtask.com"
BETTER_AUTH_URL="https://vebtask.com"

# Better Auth Secret (32+ characters)
BETTER_AUTH_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI API (existing)
OPENAI_API_KEY="your-openai-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Your App <noreply@domain.com>"

# Environment
NODE_ENV="production"
```

## Your Current Configuration

Based on what you provided, your Railway environment should have:

```env
BETTER_AUTH_SECRET="bf8a9c4e2d7f1a6b8e3c5d9f2a4b7e1c8f6a3d9e2b5c8f1a4d7e9c2b6f8a1e4d7c"
DATABASE_URL="${{MySQL.MYSQL_URL}}"
GOOGLE_CLIENT_ID="621484568338-sbdcmkhkmv5ss5uh59nu3e7a13peoknb.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
OPENAI_API_KEY="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"
OPENROUTER_API_KEY="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"
SMTP_FROM="VebTask <Admin@veblengroup.com.au>"
SMTP_HOST="smtp.gmail.com"
SMTP_PASS="ofbseybicxpfupom"
SMTP_PORT="587"
SMTP_USER="Admin@veblengroup.com.au"
VITE_APP_URL="https://vebtask.com"
BETTER_AUTH_URL="https://vebtask.com"
```