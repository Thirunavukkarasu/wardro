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
/// `FirebaseAuthService` is the real implementation; `StubAuthService` keeps
/// the UI usable when Firebase is not configured.
abstract interface class AuthService {
  /// Returns the persisted user, or `null` when nobody is signed in.
  Future<AppUser?> restoreSession();

  Future<void> signIn({required String email, required String password});

  /// Opens the provider's account chooser and signs in.
  Future<void> signInWithGoogle();

  /// Creates the account, signs the user in, and sends the verification
  /// email. Firebase does not block usage until the email is verified.
  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  });

  Future<void> resendVerificationEmail();

  Future<bool> isEmailVerified();

  /// Current ID token used as the bearer credential for backend requests.
  /// Returns `null` when no token is available (stub mode).
  Future<String?> idToken();

  Future<void> signOut();
}
