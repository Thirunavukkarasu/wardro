import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;
import 'package:flutter/services.dart' show PlatformException;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../firebase_options.dart';
import 'auth_service.dart';
import 'models/app_user.dart';

/// Firebase Authentication backend (email/password + Google).
///
/// Identity always comes from the provider; the backend verifies the ID token
/// and maps the uid to its own user row.
class FirebaseAuthService implements AuthService {
  FirebaseAuthService(this._prefs);

  static const _userKey = 'auth.firebase.user';

  final SharedPreferences _prefs;
  bool _googleInitialised = false;

  fb.FirebaseAuth get _auth => fb.FirebaseAuth.instance;

  @override
  Future<AppUser?> restoreSession() async {
    final user = _auth.currentUser;
    if (user == null) {
      await _prefs.remove(_userKey);
      return null;
    }

    final cached = _readCache();
    if (cached != null && cached.authId == user.uid) return cached;

    final appUser = _toAppUser(user);
    await _prefs.setString(_userKey, jsonEncode(appUser.toJson()));
    return appUser;
  }

  @override
  Future<String?> idToken() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    try {
      return await user.getIdToken();
    } on fb.FirebaseAuthException {
      return null;
    }
  }

  @override
  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    try {
      await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      await _cacheCurrentUser();
    } on fb.FirebaseAuthException catch (error) {
      throw AuthException(_message(error));
    }
  }

  @override
  Future<void> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        // On web the Firebase JS SDK runs the popup itself; `google_sign_in`
        // is never initialised there (it hangs without a client ID).
        await _auth.signInWithPopup(fb.GoogleAuthProvider());
      } else {
        if (!_googleInitialised) {
          await GoogleSignIn.instance.initialize(
            serverClientId: DefaultFirebaseOptions.googleServerClientId,
          );
          _googleInitialised = true;
        }
        final googleUser = await GoogleSignIn.instance.authenticate();
        final idToken = googleUser.authentication.idToken;
        if (idToken == null || idToken.isEmpty) {
          throw const AuthException(
            'Google did not return an ID token. Check the OAuth client and '
            'the Android SHA-1 fingerprint in Firebase.',
          );
        }
        await _auth.signInWithCredential(
          fb.GoogleAuthProvider.credential(idToken: idToken),
        );
      }
      await _cacheCurrentUser();
    } on fb.FirebaseAuthException catch (error) {
      debugPrint(
        '[auth] Google FirebaseAuthException ${error.code}: ${error.message}',
      );
      throw AuthException(_googleMessage(error));
    } on GoogleSignInException catch (error) {
      debugPrint(
        '[auth] GoogleSignInException ${error.code}: ${error.description}',
      );
      if (error.code == GoogleSignInExceptionCode.canceled) {
        throw const AuthException('Google sign-in was cancelled.');
      }
      throw AuthException(error.description ?? 'Google sign-in failed.');
    } on PlatformException catch (error) {
      debugPrint('[auth] Google PlatformException ${error.code}: ${error.message}');
      throw AuthException(error.message ?? 'Google sign-in failed.');
    }
  }

  @override
  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final user = credential.user;
      if (user != null) {
        final displayName = name.trim();
        if (displayName.isNotEmpty) {
          await user.updateDisplayName(displayName);
        }
        try {
          await user.sendEmailVerification();
        } on fb.FirebaseAuthException {
          // The account exists; verification can be retried from the profile.
        }
      }
      await _cacheCurrentUser();
    } on fb.FirebaseAuthException catch (error) {
      throw AuthException(_message(error));
    }
  }

  @override
  Future<void> resendVerificationEmail() async {
    final user = _auth.currentUser;
    if (user == null) {
      throw const AuthException('You are not signed in.');
    }
    try {
      await user.sendEmailVerification();
    } on fb.FirebaseAuthException catch (error) {
      throw AuthException(_message(error));
    }
  }

  @override
  Future<bool> isEmailVerified() async {
    final user = _auth.currentUser;
    if (user == null) return false;
    try {
      await user.reload();
    } on fb.FirebaseAuthException {
      return false;
    }
    return _auth.currentUser?.emailVerified ?? false;
  }

  @override
  Future<void> signOut() async {
    await _auth.signOut();
    await _prefs.remove(_userKey);
  }

  Future<void> _cacheCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) return;
    final appUser = _toAppUser(user);
    await _prefs.setString(_userKey, jsonEncode(appUser.toJson()));
  }

  AppUser? _readCache() {
    final raw = _prefs.getString(_userKey);
    if (raw == null) return null;
    try {
      return AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } on FormatException {
      return null;
    }
  }

  AppUser _toAppUser(fb.User user) {
    final name = (user.displayName ?? '').trim();
    final parts = name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    final email = user.email ?? '';

    return AppUser(
      authId: user.uid,
      firstName: parts.isNotEmpty ? parts.first : email.split('@').first,
      lastName: parts.length > 1 ? parts.sublist(1).join(' ') : '',
      email: email,
      phone: user.phoneNumber,
      imageUrl: user.photoURL,
      emailVerified: user.emailVerified,
    );
  }

  String _googleMessage(fb.FirebaseAuthException error) => switch (error.code) {
    'popup-closed-by-user' ||
    'cancelled' => 'Google sign-in was cancelled.',
    'popup-blocked' =>
      'The Google popup was blocked. Allow popups for this site and retry.',
    'unauthorized-domain' =>
      'This domain is not authorised for Google sign-in. Add "localhost" '
          'under Authentication → Settings → Authorized domains.',
    'operation-not-allowed' => 'Google sign-in is not enabled in Firebase.',
    'account-exists-with-different-credential' =>
      'An account already exists for this email with another sign-in method.',
    _ => error.message ?? 'Google sign-in failed.',
  };

  String _message(fb.FirebaseAuthException error) => switch (error.code) {
    'invalid-email' => 'That email address looks invalid.',
    'user-disabled' => 'This account has been disabled.',
    'user-not-found' ||
    'wrong-password' ||
    'invalid-credential' => 'Email or password is incorrect.',
    'email-already-in-use' => 'An account already exists for that email.',
    'weak-password' => 'Choose a stronger password.',
    'too-many-requests' => 'Too many attempts. Try again in a moment.',
    'network-request-failed' => 'Network error. Check your connection.',
    'operation-not-allowed' =>
      'Email/password sign-in is not enabled in Firebase.',
    _ => error.message ?? 'Authentication failed.',
  };
}
