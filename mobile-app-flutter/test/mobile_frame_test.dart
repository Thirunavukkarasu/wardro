import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wardro_mobile/shared/widgets/mobile_frame.dart';

void main() {
  testWidgets('wide screens render inside a phone-width frame', (tester) async {
    tester.view.physicalSize = const Size(1200, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MobileFrame(child: child!),
        home: const Scaffold(
          body: SizedBox.expand(key: Key('content')),
        ),
      ),
    );

    final size = tester.getSize(find.byKey(const Key('content')));
    expect(size.width, MobileFrame.maxWidth);

    final mediaWidth = MediaQuery.sizeOf(
      tester.element(find.byKey(const Key('content'))),
    ).width;
    expect(mediaWidth, MobileFrame.maxWidth);
  });

  testWidgets('narrow screens render edge to edge', (tester) async {
    tester.view.physicalSize = const Size(390, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MobileFrame(child: child!),
        home: const Scaffold(
          body: SizedBox.expand(key: Key('content')),
        ),
      ),
    );

    final size = tester.getSize(find.byKey(const Key('content')));
    expect(size.width, 390);

    final mediaWidth = MediaQuery.sizeOf(
      tester.element(find.byKey(const Key('content'))),
    ).width;
    expect(mediaWidth, 390);
  });
}
