import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phoenix.ai',
  appName: 'Phoenix AI',
  webDir: 'www',
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
    CapacitorHttp: {
      enabled: true  // Route fetch through native - bypasses CORS
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000a14',
      showSpinner: false
    },
    SpeechRecognition: {
      // Plugin configuration for @capacitor-community/speech-recognition
      language: 'en', // Generic 'en' for better accent support
      matches: 5,
      prompt: 'Say something',
      partialResults: true,
      popup: false
    },
    SiriShortcuts: {
      // Siri Shortcuts configuration
      // Allows "Hey Siri" voice commands for Phoenix
      appName: 'Phoenix',
      suggestedPhrases: [
        'Phoenix, book me a ride',
        'Phoenix, order my usual',
        'Phoenix, I finished my workout',
        'Phoenix, make a dinner reservation',
        'Phoenix, what\'s my day look like',
        'Phoenix, check my recovery',
        'Phoenix, help me out'
      ]
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    Geolocation: {
      // Background location tracking configuration
      // Will request "Always" permission if needed
    },
    PrivacyScreen: {
      enable: true,
      imageName: 'Splashscreen', // Show splash when app is backgrounded
      contentMode: 'scaleAspectFill',
      preventScreenshots: false // Allow screenshots for now
    }
  }
};

export default config;
