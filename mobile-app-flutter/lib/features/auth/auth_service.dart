import 'models/app_user.dart';

/// Raised for anything the user can fix by retrying or correcting input.
class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Authentication contract for the app.
///
/// The screens only ever talk to this interface. Replacing the stub with
/// Clerk means adding a `ClerkAuthService` that implements it and choosing it
/// in `AuthServiceFactory` — no widget changes.
abstract interface class AuthService {
  /// Returns the persisted user, or `null` when nobody is signed in.
  Future<AppUser?> restoreSession();

  Future<void> signIn({required String email, required String password});

  /// Starts a new account and (in a real backend) sends a verification code.
  Future<void> beginSignUp({
    required String name,
    required String email,
    required String password,
  });

  Future<void> verifyEmailCode(String code);

  Future<void> signOut();
}
