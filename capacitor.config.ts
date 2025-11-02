import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phoenix.ai',
  appName: 'Phoenix AI',
  webDir: '.',
  bundledWebRuntime: false,
  server: {
    // For development: allow localhost connections
    // Remove or comment out in production
    cleartext: true,
    allowNavigation: [
      'pal-backend-production.up.railway.app'
    ]
  },
  ios: {
    contentInset: 'always',
    // iOS-specific configuration
    scheme: 'Phoenix',
    // Allow inline media playback (for TTS audio)
    allowsInlineMediaPlayback: true,
    // Required for speech recognition
    limitsNavigationsToAppBoundDomains: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000a14',
      showSpinner: false
    },
    SpeechRecognition: {
      // Plugin configuration for @capacitor-community/speech-recognition
      language: 'en-US',
      matches: 5,
      prompt: 'Say something',
      partialResults: true,
      popup: false
    }
  }
};

export default config;
