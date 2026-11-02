import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/config/app_config.dart';
import 'auth_service.dart';
import 'models/app_user.dart';

/// Firebase Authentication backend (email + password).
///
/// Firebase signs the user in as soon as the account is created, so the
/// sign-up flow ends with a "verification link sent" step rather than a
/// 6-digit code — Firebase does not issue codes for email verification.
class FirebaseAuthService implements AuthService {
  FirebaseAuthService(this._prefs);

  static const _userKey = 'auth.firebase.user';

  final SharedPreferences _prefs;

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
    return _toAppUser(user);
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
    final appUser = await _toAppUser(user);
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

  Future<AppUser> _toAppUser(fb.User user) async {
    final name = (user.displayName ?? '').trim();
    final parts = name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    final email = user.email ?? '';

    return AppUser(
      // The backend still keys wardrobes by a numeric user id. Until it maps
      // Firebase uids to user rows, the demo account is used for data access.
      id: AppConfig.demoUserId,
      authId: user.uid,
      firstName: parts.isNotEmpty ? parts.first : email.split('@').first,
      lastName: parts.length > 1 ? parts.sublist(1).join(' ') : '',
      email: email,
      phone: user.phoneNumber,
      imageUrl: user.photoURL,
      emailVerified: user.emailVerified,
    );
  }

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
