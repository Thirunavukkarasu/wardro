import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

/// Firebase project configuration (project `wardo-ce8d5`).
///
/// Android comes from `android/app/google-services.json` (package
/// `com.om.wardo`). Web comes from the registered web app
/// `1:251900114942:web:6d482f04b8b02cc63372af`.
class DefaultFirebaseOptions {
  const DefaultFirebaseOptions._();

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'Firebase is not configured for $defaultTargetPlatform yet. '
          'Add the GoogleService-Info.plist (iOS) and rerun FlutterFire.',
        );
    }
  }

  /// OAuth *web* client ID (from google-services.json). `google_sign_in`
  /// passes this as `serverClientId` on Android to receive an ID token.
  static const String googleServerClientId = '251900114942-ntfihbiuu1b7og3t79r79oln1tv4rbgb.apps.googleusercontent.com';

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDBUUxiJTDjJNTHwtp3v92xTbeZRRHomb8',
    appId: '1:251900114942:android:4b6fb438155e6a373372af',
    messagingSenderId: '251900114942',
    projectId: 'wardo-ce8d5',
    storageBucket: 'wardo-ce8d5.firebasestorage.app',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDpECg48ZPWHQ3LhozoNpAg8uaP2_y_fik',
    appId: '1:251900114942:web:6d482f04b8b02cc63372af',
    messagingSenderId: '251900114942',
    projectId: 'wardo-ce8d5',
    authDomain: 'wardo-ce8d5.firebaseapp.com',
    storageBucket: 'wardo-ce8d5.firebasestorage.app',
  );
}
