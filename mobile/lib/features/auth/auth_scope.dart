import 'package:flutter/widgets.dart';

import 'auth_controller.dart';

/// Makes the [AuthController] available to the widget tree and rebuilds
/// dependents when the session changes.
class AuthScope extends InheritedNotifier<AuthController> {
  const AuthScope({
    super.key,
    required AuthController controller,
    required super.child,
  }) : super(notifier: controller);

  static AuthController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AuthScope>();
    assert(scope != null, 'No AuthScope found above this widget.');
    return scope!.notifier!;
  }
}
