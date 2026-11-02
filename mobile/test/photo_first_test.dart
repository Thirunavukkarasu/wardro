import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wardro_mobile/core/network/api_client.dart';
import 'package:wardro_mobile/core/network/api_exception.dart';
import 'package:wardro_mobile/core/network/api_scope.dart';
import 'package:wardro_mobile/core/theme/app_theme.dart';
import 'package:wardro_mobile/features/items/item_detail_screen.dart';
import 'package:wardro_mobile/features/items/models/wardrobe_item.dart';
import 'package:wardro_mobile/shared/models/picked_photo.dart';
import 'package:wardro_mobile/shared/utils/layout.dart';

void main() {
  group('ApiClient.uploadPhoto', () {
    test('posts multipart form data and returns the stored URL', () async {
      late http.Request captured;
      final client = MockClient((request) async {
        captured = request;
        return http.Response(
          jsonEncode({
            'data': {'url': 'http://test/api/uploads/abc.png'},
          }),
          201,
          headers: {'content-type': 'application/json'},
        );
      });

      final api = ApiClient(client: client, baseUrl: 'http://test/api');
      final url = await api.uploadPhoto(
        PickedPhoto(
          bytes: Uint8List.fromList([1, 2, 3, 4]),
          path: 'photo.png',
          mimeType: 'image/png',
        ),
      );

      expect(url, 'http://test/api/uploads/abc.png');
      expect(captured.method, 'POST');
      expect(captured.url.path, '/api/uploads');
      expect(
        captured.headers['content-type'],
        contains('multipart/form-data'),
      );
      expect(captured.bodyBytes, isNotEmpty);
    });

    test('surfaces the backend error message', () async {
      final client = MockClient(
        (_) async => http.Response(
          jsonEncode({'error': 'Only image uploads are supported'}),
          415,
          headers: {'content-type': 'application/json'},
        ),
      );

      final api = ApiClient(client: client, baseUrl: 'http://test/api');

      await expectLater(
        api.uploadPhoto(
          PickedPhoto(bytes: Uint8List.fromList([1]), path: 'file.txt'),
        ),
        throwsA(
          isA<ApiException>().having(
            (error) => error.message,
            'message',
            contains('Only image uploads'),
          ),
        ),
      );
    });
  });

  group('PickedPhoto', () {
    test('infers the mime type from the path when absent', () {
      expect(
        PickedPhoto(bytes: Uint8List(0), path: '/tmp/a.PNG').resolvedMimeType,
        'image/png',
      );
      expect(
        PickedPhoto(bytes: Uint8List(0), path: 'blob:http://x/y')
            .resolvedMimeType,
        'image/jpeg',
      );
      expect(
        PickedPhoto(
          bytes: Uint8List(0),
          path: 'photo.jpg',
          mimeType: 'image/webp',
        ).resolvedMimeType,
        'image/webp',
      );
    });
  });

  group('photoColumnsFor', () {
    test('adds columns as the screen widens', () {
      expect(photoColumnsFor(400), 2);
      expect(photoColumnsFor(800), 3);
      expect(photoColumnsFor(1400), 4);
    });
  });

  group('ApiClient.delete', () {
    test('sends DELETE and tolerates a 204 with no body', () async {
      late http.Request captured;
      final client = MockClient((request) async {
        captured = request;
        return http.Response('', 204);
      });

      final api = ApiClient(client: client, baseUrl: 'http://test/api');
      final result = await api.delete('/wardrobeItems/7');

      expect(result, isNull);
      expect(captured.method, 'DELETE');
      expect(captured.url.path, '/api/wardrobeItems/7');
    });

    test('throws ApiException with the backend message on failure', () async {
      final client = MockClient(
        (_) async => http.Response(
          jsonEncode({'error': 'Item not found'}),
          404,
          headers: {'content-type': 'application/json'},
        ),
      );

      final api = ApiClient(client: client, baseUrl: 'http://test/api');

      await expectLater(
        api.delete('/wardrobeItems/999'),
        throwsA(
          isA<ApiException>().having(
            (error) => error.message,
            'message',
            'Item not found',
          ),
        ),
      );
    });
  });

  group('ItemDetailScreen deletion', () {
    testWidgets('confirms, calls DELETE, and pops with true', (tester) async {
      final requests = <String>[];
      final client = MockClient((request) async {
        requests.add('${request.method} ${request.url.path}');
        return http.Response('', 204);
      });

      final item = WardrobeItem(
        id: 7,
        wardrobeId: 3,
        userId: 4,
        itemName: 'Pants',
      );

      bool? deletionResult;
      await tester.pumpWidget(
        ApiScope(
          client: ApiClient(client: client, baseUrl: 'http://test/api'),
          child: MaterialApp(
            theme: AppTheme.light,
            home: Builder(
              builder: (context) => Scaffold(
                body: Center(
                  child: ElevatedButton(
                    onPressed: () async {
                      deletionResult = await Navigator.of(context).push<bool>(
                        MaterialPageRoute<bool>(
                          builder: (_) => ItemDetailScreen(item: item),
                        ),
                      );
                    },
                    child: const Text('open'),
                  ),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();
      expect(find.text('Pants'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.delete_outline));
      await tester.pumpAndSettle();
      expect(find.text('Delete item?'), findsOneWidget);

      await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
      await tester.pumpAndSettle();

      expect(requests, contains('DELETE /api/wardrobeItems/7'));
      expect(deletionResult, isTrue);
      expect(find.text('open'), findsOneWidget, reason: 'detail screen popped');
    });

    testWidgets('cancelling does not call the API', (tester) async {
      var calls = 0;
      final client = MockClient((_) async {
        calls++;
        return http.Response('', 204);
      });

      final item = WardrobeItem(
        id: 8,
        wardrobeId: 3,
        userId: 4,
        itemName: 'Shirt',
      );

      await tester.pumpWidget(
        ApiScope(
          client: ApiClient(client: client, baseUrl: 'http://test/api'),
          child: MaterialApp(
            theme: AppTheme.light,
            home: ItemDetailScreen(item: item),
          ),
        ),
      );

      await tester.tap(find.byIcon(Icons.delete_outline));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(TextButton, 'Cancel'));
      await tester.pumpAndSettle();

      expect(calls, 0);
      expect(find.text('Shirt'), findsOneWidget);
    });
  });

  group('ItemDetailScreen', () {
    testWidgets('puts the photo first and lists the details', (tester) async {
      final item = WardrobeItem(
        id: 1,
        wardrobeId: 3,
        userId: 4,
        itemName: 'Pants',
        brand: 'H&M',
        category: 'Formals',
        color: 'grey',
        size: '32',
        price: 1500,
        state: 'in_use',
        purchaseDate: DateTime.utc(2026, 11, 1),
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light,
          home: ItemDetailScreen(item: item),
        ),
      );
      await tester.pumpAndSettle();

      // Title is overlaid on the hero image.
      expect(find.text('Pants'), findsOneWidget);
      expect(find.text('H&M · Formals'), findsOneWidget);

      // Details and date cards.
      expect(find.text('DETAILS'), findsOneWidget);
      expect(find.text('₹1,500'), findsOneWidget);
      expect(find.text('Size 32'), findsWidgets);
      expect(find.text('In use'), findsOneWidget);
      expect(find.text('DATES'), findsOneWidget);
      expect(find.text('Bought'), findsOneWidget);
      expect(find.text('1 Nov 2026'), findsOneWidget);
    });
  });
}
