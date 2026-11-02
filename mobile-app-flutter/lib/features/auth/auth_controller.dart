import 'package:flutter/foundation.dart';

import 'auth_service.dart';
import 'models/app_user.dart';

enum AuthStatus { restoring, signedOut, signedIn }

/// Owns the session and the transient UI state (loading, error) that the auth
/// screens render.
class AuthController extends ChangeNotifier {
  AuthController(this._service);

  final AuthService _service;

  AuthStatus _status = AuthStatus.restoring;
  AppUser? _user;
  bool _isBusy = false;
  String? _errorMessage;

  AuthStatus get status => _status;
  AppUser? get user => _user;
  bool get isSignedIn => _status == AuthStatus.signedIn && _user != null;
  bool get isBusy => _isBusy;
  String? get errorMessage => _errorMessage;

  Future<void> initialize() async {
    final restored = await _service.restoreSession();
    _user = restored;
    _status = restored == null ? AuthStatus.signedOut : AuthStatus.signedIn;
    notifyListeners();
  }

  Future<bool> signIn({required String email, required String password}) {
    return _run(() => _service.signIn(email: email, password: password));
  }

  Future<bool> signUp({
    required String name,
    required String email,
    required String password,
  }) {
    return _run(
      () => _service.signUp(name: name, email: email, password: password),
    );
  }

  Future<bool> resendVerificationEmail() {
    return _run(_service.resendVerificationEmail);
  }

  Future<void> signOut() async {
    await _service.signOut();
    _user = null;
    _status = AuthStatus.signedOut;
    _errorMessage = null;
    notifyListeners();
  }

  void clearError() {
    if (_errorMessage == null) return;
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> _run(Future<void> Function() action) async {
    if (_isBusy) return false;
    _isBusy = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await action();
      _user = await _service.restoreSession();
      _status = _user == null ? AuthStatus.signedOut : AuthStatus.signedIn;
      return true;
    } on AuthException catch (error) {
      _errorMessage = error.message;
      return false;
    } catch (_) {
      _errorMessage = 'Something went wrong. Please try again.';
      return false;
    } finally {
      _isBusy = false;
      notifyListeners();
    }
  }
}
