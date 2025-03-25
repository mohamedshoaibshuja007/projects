# Farmer-Vendor Mobile App

A React Native mobile application that connects farmers and vendors through a secure authentication system.

## Features

- Separate authentication flows for Farmers and Vendors
- Firebase Authentication integration
- Password reset functionality with email verification
- Modern and responsive UI
- Secure user data management

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Update Firebase Configuration:
Navigate to `src/config/firebase.ts` and add your Firebase configuration details:
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "mine-805ba",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

3. Start the development server:
```bash
npm start
```

4. Run on your device:
- Scan the QR code with Expo Go (Android)
- Or press 'i' for iOS simulator
- Or press 'a' for Android emulator

## Project Structure

```
farmer-vendor-app/
├── src/
│   ├── config/
│   │   └── firebase.ts
│   ├── screens/
│   │   ├── common/
│   │   │   └── ForgotPassword.tsx
│   │   ├── farmer/
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── vendor/
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   └── InitialSelection.tsx
│   └── components/
├── App.tsx
├── package.json
└── README.md
```

## Technology Stack

- React Native
- Expo
- Firebase Authentication
- React Navigation
- React Native Paper
