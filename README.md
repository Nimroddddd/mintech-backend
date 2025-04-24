# Mintech Backend API

This is the backend API for the Mintech e-commerce platform.

## Vercel Deployment

This backend is configured to be deployed on Vercel as serverless functions.

### Environment Variables

Set the following environment variables in Vercel dashboard:

```
# Database configuration
PG_USER=your_db_user
PG_HOST=your_db_host
PG_DATABASE=your_db_name
PG_PASSWORD=your_db_password
PG_PORT=5432

# JWT configuration
SECRET=your_jwt_secret

# Email configuration
EMAIL=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Flutterwave payment API
FLUTTER_KEY=your_flutterwave_api_key
```

### Deployment Steps

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel`
4. To deploy to production: `vercel --prod`

For continuous deployment, connect your GitHub repository to Vercel.

## Local Development

1. Install dependencies: `npm install` or `yarn`
2. Start development server: `npm run dev` or `yarn dev`
3. The server will run at `http://localhost:3000` 