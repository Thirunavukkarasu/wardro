import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:wardro_mobile/app.dart';
import 'package:wardro_mobile/core/network/api_client.dart';
import 'package:wardro_mobile/features/auth/auth_controller.dart';
import 'package:wardro_mobile/features/auth/auth_service.dart';
import 'package:wardro_mobile/features/auth/stub_auth_service.dart';
import 'package:wardro_mobile/shared/widgets/app_button.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  group('AppButton', () {
    testWidgets('renders its title and invokes the callback', (tester) async {
      var taps = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(title: 'Sign In', onPressed: () => taps++),
          ),
        ),
      );

      expect(find.text('Sign In'), findsOneWidget);
      await tester.tap(find.text('Sign In'));
      await tester.pump();
      expect(taps, 1);
    });

    testWidgets('shows a spinner and blocks taps while loading', (
      tester,
    ) async {
      var taps = 0;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: AppButton(
              title: 'Sign In',
              isLoading: true,
              onPressed: () => taps++,
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(find.byType(InkWell), warnIfMissed: false);
      await tester.pump();
      expect(taps, 0);
    });
  });

  group('StubAuthService', () {
    late StubAuthService service;

    setUp(() async {
      final prefs = await SharedPreferences.getInstance();
      service = StubAuthService(prefs);
    });

    test('starts signed out', () async {
      expect(await service.restoreSession(), isNull);
    });

    test('sign in persists a session and sign out clears it', () async {
      await service.signIn(email: 'ada@example.com', password: 'password123');

      final user = await service.restoreSession();
      expect(user, isNotNull);
      expect(user!.email, 'ada@example.com');
      expect(user.initials, 'A');

      await service.signOut();
      expect(await service.restoreSession(), isNull);
    });

    test('sign up requires a six-digit verification code', () async {
      await service.beginSignUp(
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
      );

      await expectLater(
        service.verifyEmailCode('12'),
        throwsA(isA<AuthException>()),
      );

      await service.verifyEmailCode('123456');
      final user = await service.restoreSession();
      expect(user?.firstName, 'Ada');
      expect(user?.lastName, 'Lovelace');
    });
  });

  group('AuthController', () {
    test('moves from signed out to signed in and back', () async {
      final prefs = await SharedPreferences.getInstance();
      final controller = AuthController(StubAuthService(prefs));
      await controller.initialize();
      expect(controller.status, AuthStatus.signedOut);

      final ok = await controller.signIn(
        email: 'ada@example.com',
        password: 'password123',
      );

      expect(ok, isTrue);
      expect(controller.isSignedIn, isTrue);
      expect(controller.user?.email, 'ada@example.com');

      await controller.signOut();
      expect(controller.status, AuthStatus.signedOut);
      expect(controller.user, isNull);
    });
  });

  group('WardroApp', () {
    testWidgets('sign-up flow lands on the home tab', (tester) async {
      final prefs = await SharedPreferences.getInstance();
      final controller = AuthController(StubAuthService(prefs));
      await controller.initialize();

      await tester.pumpWidget(
        WardroApp(
          authController: controller,
          // Unreachable on purpose: the home tab should show its error state
          // without leaving a pending request behind.
          apiClient: ApiClient(baseUrl: 'http://127.0.0.1:9/api'),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Welcome to Wardro'), findsOneWidget);

      await tester.tap(find.text('Skip'));
      await tester.pumpAndSettle();
      expect(find.text('Create Your Account'), findsOneWidget);

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), 'Ada Lovelace');
      await tester.enterText(fields.at(1), 'ada@example.com');
      await tester.enterText(fields.at(2), 'password123');

      final signUpButton = find.widgetWithText(AppButton, 'Sign Up');
      await tester.ensureVisible(signUpButton);
      await tester.pumpAndSettle();
      await tester.tap(signUpButton);
      await tester.pumpAndSettle();
      expect(find.text('Verification'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField).last, '123456');
      await tester.tap(find.widgetWithText(AppButton, 'Verify Email'));
      await tester.pumpAndSettle();
      expect(find.text('Verified'), findsOneWidget);

      await tester.tap(find.widgetWithText(AppButton, 'Browse Home'));
      await tester.pumpAndSettle();

      expect(find.text('Your Wardrobes'), findsOneWidget);
      expect(controller.isSignedIn, isTrue);
    });
  });
}
