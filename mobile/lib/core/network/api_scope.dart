import 'package:flutter/widgets.dart';

import 'api_client.dart';

/// Provides the shared [ApiClient] to the widget tree.
class ApiScope extends InheritedWidget {
  const ApiScope({super.key, required this.client, required super.child});

  final ApiClient client;

  static ApiClient of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ApiScope>();
    assert(scope != null, 'No ApiScope found above this widget.');
    return scope!.client;
  }

  @override
  bool updateShouldNotify(ApiScope oldWidget) => client != oldWidget.client;
}
