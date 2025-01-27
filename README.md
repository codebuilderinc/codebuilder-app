# CodeBuilder Admin

CodeBuilder Admin is a mobile application built with React Native and Expo. This project is designed to manage and administer various functionalities of the CodeBuilder platform.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Building the App](#building-the-app)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/codebuilder-admin.git
   cd codebuilder-admin
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Install the Expo CLI:
   ```sh
   npm install -g expo-cli
   ```

## Configuration

1. Create a file in the root directory and add your environment variables:

   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   ```

2. Update the file with your project-specific configurations.

## Running the App

To run the app in development mode, use the following command:

```sh
expo start
```
