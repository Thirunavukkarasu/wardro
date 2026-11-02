import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'auth_service.dart';
import 'models/app_user.dart';

/// Offline auth backend used when Firebase is not configured.
///
/// Accepts any valid-looking credentials and keeps the "session" in
/// `SharedPreferences`. There is no ID token, so backend requests that require
/// authentication will be rejected in this mode.
class StubAuthService implements AuthService {
  StubAuthService(this._prefs);

  static const _userKey = 'auth.stub.user';

  final SharedPreferences _prefs;

  @override
  Future<AppUser?> restoreSession() async {
    final raw = _prefs.getString(_userKey);
    if (raw == null) return null;
    try {
      return AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } on FormatException {
      await _prefs.remove(_userKey);
      return null;
    }
  }

  @override
  Future<String?> idToken() async => null;

  @override
  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    await _simulateLatency();
    await _persist(
      _buildUser(email: email.trim(), name: email.split('@').first),
    );
  }

  @override
  Future<void> signInWithGoogle() async {
    await _simulateLatency();
    await _persist(
      const AppUser(
        authId: 'stub_google_user',
        firstName: 'Google',
        lastName: 'User',
        email: 'google.user@example.com',
        emailVerified: true,
      ),
    );
  }

  @override
  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    await _simulateLatency();
    await _persist(_buildUser(email: email.trim(), name: name));
  }

  @override
  Future<void> resendVerificationEmail() async {
    await _simulateLatency();
  }

  @override
  Future<bool> isEmailVerified() async => true;

  @override
  Future<void> signOut() async {
    await _prefs.remove(_userKey);
  }

  Future<void> _persist(AppUser user) async {
    await _prefs.setString(_userKey, jsonEncode(user.toJson()));
  }

  AppUser _buildUser({required String email, required String name}) {
    final trimmed = name.trim();
    final parts = trimmed.isEmpty
        ? const <String>[]
        : trimmed.split(RegExp(r'\s+'));
    final slug = email.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');

    return AppUser(
      authId: 'stub_$slug',
      firstName: parts.isNotEmpty ? parts.first : email.split('@').first,
      lastName: parts.length > 1 ? parts.sublist(1).join(' ') : '',
      email: email,
      emailVerified: true,
    );
  }

  Future<void> _simulateLatency() =>
      Future<void>.delayed(const Duration(milliseconds: 500));
}
