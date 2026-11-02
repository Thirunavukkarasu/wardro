import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wardro_mobile/core/network/api_client.dart';
import 'package:wardro_mobile/core/network/api_scope.dart';
import 'package:wardro_mobile/core/theme/app_theme.dart';
import 'package:wardro_mobile/features/items/models/wardrobe_item.dart';
import 'package:wardro_mobile/features/wardrobe/models/wardrobe.dart';
import 'package:wardro_mobile/features/wardrobe/wardrobe_items_screen.dart';
import 'package:wardro_mobile/shared/utils/formatters.dart';

void main() {
  group('Wardrobe', () {
    test('parses itemCount from the summary endpoint', () {
      final wardrobe = Wardrobe.fromJson(const {
        'id': 3,
        'userId': 4,
        'name': 'Sister',
        'description': 'Sister closet',
        'itemCount': 3,
      });

      expect(wardrobe.id, 3);
      expect(wardrobe.itemCount, 3);
      expect(wardrobe.name, 'Sister');
    });

    test('defaults itemCount to 0 when absent', () {
      final wardrobe = Wardrobe.fromJson(const {
        'id': 1,
        'userId': 1,
        'name': 'Old shape',
      });

      expect(wardrobe.itemCount, 0);
    });
  });

  group('WardrobeItem', () {
    test('parses a numeric price sent as a string and ISO dates', () {
      final item = WardrobeItem.fromJson(const {
        'id': 1,
        'wardrobeId': 3,
        'userId': 4,
        'itemName': 'Pants',
        'price': '1500',
        'purchaseDate': '2026-11-01T18:30:00.000Z',
        'expiryDate': '2026-11-29T18:30:00.000Z',
      });

      expect(item.itemName, 'Pants');
      expect(item.price, 1500);
      expect(item.purchaseDate, isNotNull);
      expect(item.expiryDate?.isAfter(item.purchaseDate!), isTrue);
    });

    test('only exposes absolute URLs as renderable photos', () {
      const base = {
        'id': 1,
        'wardrobeId': 3,
        'userId': 4,
        'itemName': 'Pants',
      };

      expect(
        WardrobeItem.fromJson({
          ...base,
          'photoUri': 'https://cdn.example.com/pants.jpg',
        }).photoUrl,
        'https://cdn.example.com/pants.jpg',
      );
      expect(
        WardrobeItem.fromJson({
          ...base,
          'photoUri': 'blob:http://localhost:8080/abc',
        }).photoUrl,
        isNull,
      );
      expect(WardrobeItem.fromJson(base).photoUrl, isNull);
    });
  });

  group('formatters', () {
    test('groups prices in the Indian format', () {
      expect(formatPrice(1500), '₹1,500');
      expect(formatPrice(125000), '₹1,25,000');
      expect(formatPrice(800), '₹800');
    });

    test('maps backend states to labels and colours', () {
      expect(stateLabel('newly_purchased'), 'New');
      expect(stateLabel('in_use'), 'In use');
      expect(stateLabel('archived'), 'Archived');
      expect(stateLabel('odd_state'), 'odd state');
    });
  });

  group('WardrobeItemsScreen', () {
    testWidgets('lists the items returned for the wardrobe', (tester) async {
      final client = MockClient((request) async {
        if (request.url.path.contains('/wardrobeItems/3')) {
          return http.Response(
            jsonEncode({
              'data': [
                {
                  'id': 1,
                  'wardrobeId': 3,
                  'userId': 4,
                  'itemName': 'Pants',
                  'brand': 'H&M',
                  'category': 'Formals',
                  'color': 'grey',
                  'size': '32',
                  'price': '1500',
                  'state': 'newly_purchased',
                  'purchaseDate': '2026-11-01T18:30:00.000Z',
                },
              ],
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response(
          jsonEncode({'data': <dynamic>[]}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      await tester.pumpWidget(
        ApiScope(
          client: ApiClient(client: client, baseUrl: 'http://test/api'),
          child: MaterialApp(
            theme: AppTheme.light,
            home: const WardrobeItemsScreen(
              wardrobe: Wardrobe(
                id: 3,
                userId: 4,
                name: 'Sister',
                description: 'Sister closet',
                itemCount: 1,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Sister'), findsWidgets);
      expect(find.text('Pants'), findsOneWidget);
      expect(find.text('H&M · Formals'), findsOneWidget);
      expect(find.text('₹1,500'), findsOneWidget);
      expect(find.text('New'), findsOneWidget);
    });

    testWidgets('shows the empty state when a wardrobe has no items', (
      tester,
    ) async {
      final client = MockClient(
        (_) async => http.Response(
          jsonEncode({'data': <dynamic>[]}),
          200,
          headers: {'content-type': 'application/json'},
        ),
      );

      await tester.pumpWidget(
        ApiScope(
          client: ApiClient(client: client, baseUrl: 'http://test/api'),
          child: MaterialApp(
            theme: AppTheme.light,
            home: const WardrobeItemsScreen(
              wardrobe: Wardrobe(
                id: 9,
                userId: 4,
                name: 'Empty',
                description: '',
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Nothing here yet'), findsOneWidget);
      expect(find.text('Add Item'), findsOneWidget);
    });
  });
}
