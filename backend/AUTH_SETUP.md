# OTP & Google Auth Setup

## Google OAuth

Add this **Authorized redirect URI** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

```
http://localhost:5000/api/auth/google/callback
```

For production, add:
```
https://your-backend-domain.com/api/auth/google/callback
```

## Environment Variables (backend .env)

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` – for OTP emails
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – from Google Cloud
- `BACKEND_URL` (optional) – e.g. `http://localhost:5000` – used for OAuth callback
- `FRONTEND_URL` (optional) – e.g. `http://localhost:5173` – where to redirect after Google login
