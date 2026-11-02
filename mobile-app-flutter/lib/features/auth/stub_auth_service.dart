import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/config/app_config.dart';
import 'auth_service.dart';
import 'models/app_user.dart';

/// Temporary auth backend.
///
/// Accepts any valid-looking credentials and keeps the "session" in
/// `SharedPreferences`, so the UI can be built and demoed end to end. The
/// email verification step accepts any six-digit code.
///
/// Replace with `clerk_flutter` before shipping; see `README.md`.
class StubAuthService implements AuthService {
  StubAuthService(this._prefs);

  static const _userKey = 'auth.stub.user';
  static const _pendingKey = 'auth.stub.pending_signup';

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
  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    await _simulateLatency();
    await _persist(_buildUser(email: email.trim(), name: email.split('@').first));
  }

  @override
  Future<void> beginSignUp({
    required String name,
    required String email,
    required String password,
  }) async {
    await _simulateLatency();
    await _prefs.setString(
      _pendingKey,
      jsonEncode({
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
        'password': password,
      }),
    );
  }

  @override
  Future<void> verifyEmailCode(String code) async {
    await _simulateLatency();
    if (code.trim().length != 6) {
      throw const AuthException('Enter the 6-digit code from your email.');
    }

    final raw = _prefs.getString(_pendingKey);
    if (raw == null) {
      throw const AuthException('No sign-up is in progress. Try again.');
    }

    final pending = jsonDecode(raw) as Map<String, dynamic>;
    await _persist(
      _buildUser(
        email: pending['email'] as String,
        name: pending['name'] as String? ?? '',
      ),
    );
    await _prefs.remove(_pendingKey);
  }

  @override
  Future<void> signOut() async {
    await _prefs.remove(_userKey);
    await _prefs.remove(_pendingKey);
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
      id: AppConfig.demoUserId,
      clerkId: 'stub_$slug',
      firstName: parts.isNotEmpty ? parts.first : email.split('@').first,
      lastName: parts.length > 1 ? parts.sublist(1).join(' ') : '',
      email: email,
    );
  }

  Future<void> _simulateLatency() =>
      Future<void>.delayed(const Duration(milliseconds: 500));
}
