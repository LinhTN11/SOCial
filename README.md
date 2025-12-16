# Social App (Instagram Clone)

A full-featured social media application built with React Native (Expo), TypeScript, and Firebase.

## Features

- **Authentication**: Secure Login & Signup with Firebase Auth.
- **Feed**: Infinite scrolling home feed with posts (images, captions, likes).
- **Stories**: 24-hour ephemeral stories with a full-screen viewer.
- **Reels**: TikTok-style vertical video feed with infinite scroll.
- **Chat**: Real-time messaging with image support and read receipts.
- **Search**: Masonry grid explore page and user search.
- **Profile**: User profiles, follow system, and post grid.
- **Notifications**: Push notifications for messages and interactions.

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **Styling**: StyleSheet, Lucide Icons
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore)
- **Media**: Expo Image Picker, Expo AV

## Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd SOCial
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Firebase Configuration**:
    - Create a Firebase project.
    - Enable Authentication (Email/Password).
    - Enable Firestore Database.
    - Create a `firebaseConfig.ts` file in `src/` with your credentials.

4.  **Run the app**:
    ```bash
    npx expo start
    ```

## Project Structure

- `src/components`: Reusable UI components.
- `src/screens`: Application screens.
- `src/navigation`: Navigation configuration.
- `src/services`: Firebase service functions.
- `src/store`: Global state management (Zustand).
- `src/types`: TypeScript interfaces.
- `src/theme`: Color palette and spacing.

## License

MIT
