# MyRoadTrip
MyRoadTrip is a mobile app built in React Native (Expo), for booking taxi services.

## Notes
This project was only tracked on Hackatime, not on git, to compensate for this, please check `revision-history.md` (Okay'ed by other reviewers)

## How to run

1. Clone the repository
   ```bash
   git clone https://github.com/utkrstht/myroadtrip
   cd myroadtrip
   ```

2. Install dependencies
   `npm i`

3. Set up environment variables
   `cp .env.example .env.local`  
   Edit `.env.local` and fill in your variables.

4. Create Firebase config
   `cp utils/firebaseConfigExample.ts utils/firebaseConfig.ts`  
   Edit `utils/firebaseConfig.ts` with your Firebase project credentials.

5. Create app config
   `cp app.config.example.js app.config.js`  
   Populate app config with your credentials.

## Running

```bash
npx expo start      # Start Expo dev server
npx expo start --tunnel # Start Global Expo dev server (ngrok is required for this)
```

## Building with EAS

Build profiles are configured in `eas.json`:

```bash
eas build --profile development   # Development build
eas build --profile preview       # Internal preview
eas build --profile production    # Production/App Store build
```

## Environment Variables

All secrets are managed via `.env.local`. See `.env.example` for the full list:

`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API 
`TD_BAMBORA_API_ACCESS_KEY`: TD Bambora access key
`TD_BAMBORA_MERCHANT_ID`: TD Bambora merchant ID 
`TD_BAMBORA_HASH_KEY`: TD Bambora hash key
`EXPO_PUBLIC_TD_PAYMENT_ENDPOINT`: Payment endpoint URL 
`EXPO_PUBLIC_FIREBASE_*`: Firebase project credentials

## AI usage
- Login/Signup page UI
- Partner with us UI
- Debugging in TD Bank Payment Gateway

## Prerequisites

- Node 18+
- npm
- Expo CLI
- Physical device: Expo Go app (iOS/Android)
