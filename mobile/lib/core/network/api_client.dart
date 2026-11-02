import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:firebase_storage/firebase_storage.dart' as storage;
import 'package:http/http.dart' as http;

import '../../shared/models/picked_photo.dart';
import '../config/app_config.dart';
import 'api_exception.dart';

typedef AuthTokenProvider = Future<String?> Function();

/// Thin wrapper over `package:http` that understands the backend's
/// `{ "data": ... }` envelope and attaches the current Firebase ID token.
class ApiClient {
  ApiClient({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  final http.Client _client;
  final String _baseUrl;

  /// Supplied by the auth layer. Every request that has one carries
  /// `Authorization: Bearer <idToken>`.
  AuthTokenProvider? tokenProvider;

  Future<dynamic> get(String path) async {
    final headers = await _headers();
    return _send(() => _client.get(_uri(path), headers: headers));
  }

  Future<dynamic> post(String path, {Object? body}) async {
    final headers = await _headers();
    return _send(
      () => _client.post(
        _uri(path),
        headers: headers,
        body: jsonEncode(body ?? const <String, dynamic>{}),
      ),
    );
  }

  Future<dynamic> delete(String path) async {
    final headers = await _headers();
    return _send(() => _client.delete(_uri(path), headers: headers));
  }

  /// Uploads a picked photo straight to Firebase Storage and returns the
  /// download URL to store as `photoUri`.
  ///
  /// Photos live under `users/{uid}/items/...`, which is the path the Storage
  /// rules allow the signed-in user to write.
  Future<String> uploadPhoto(PickedPhoto photo) async {
    final uid = fb.FirebaseAuth.instance.currentUser?.uid;
    if (uid == null || uid.isEmpty) {
      throw const ApiException('Sign in again to upload photos.');
    }

    final suffix = Random().nextInt(1 << 32).toRadixString(36);
    final path =
        'users/$uid/items/${DateTime.now().microsecondsSinceEpoch}-$suffix.${_extensionFor(photo)}';

    try {
      final ref = storage.FirebaseStorage.instance.ref(path);
      await ref.putData(
        photo.bytes,
        storage.SettableMetadata(contentType: photo.resolvedMimeType),
      );
      return await ref.getDownloadURL();
    } on storage.FirebaseException catch (error) {
      throw ApiException(
        error.message ?? 'Could not upload the photo.',
        cause: error,
      );
    } on Exception catch (error) {
      throw ApiException(
        'Could not upload the photo. Check your connection.',
        cause: error,
      );
    }
  }

  String _extensionFor(PickedPhoto photo) {
    return switch (photo.resolvedMimeType) {
      'image/png' => 'png',
      'image/webp' => 'webp',
      'image/gif' => 'gif',
      _ => 'jpg',
    };
  }

  void dispose() => _client.close();

  Future<Map<String, String>> _headers({
    bool includeJsonContentType = true,
  }) async {
    final headers = <String, String>{
      // ngrok serves an interstitial HTML page to browser-like clients.
      'ngrok-skip-browser-warning': 'true',
    };
    if (includeJsonContentType) headers['Content-Type'] = 'application/json';

    final token = await tokenProvider?.call();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Uri _uri(String path) {
    final normalized = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$_baseUrl$normalized');
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    final http.Response response;
    try {
      response = await request().timeout(AppConfig.requestTimeout);
    } on TimeoutException catch (error) {
      throw ApiException('The request timed out.', cause: error);
    } on Exception catch (error) {
      throw ApiException(
        'Could not reach the server. Check your connection.',
        cause: error,
      );
    }

    final dynamic decoded = _decode(response.body);

    if (response.statusCode == 401) {
      throw const ApiException(
        'Your session has expired. Please sign in again.',
        statusCode: 401,
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _errorMessage(decoded) ??
            'Request failed with status ${response.statusCode}.',
        statusCode: response.statusCode,
      );
    }

    if (decoded is Map<String, dynamic> && decoded.containsKey('data')) {
      return decoded['data'];
    }
    return decoded;
  }

  dynamic _decode(String body) {
    if (body.isEmpty) return null;
    try {
      return jsonDecode(body);
    } on FormatException {
      return body;
    }
  }

  String? _errorMessage(dynamic decoded) {
    if (decoded is Map<String, dynamic>) {
      final error = decoded['error'];
      if (error is String && error.isNotEmpty) return error;
      final message = decoded['message'];
      if (message is String && message.isNotEmpty) return message;
    }
    if (decoded is String && decoded.isNotEmpty && decoded.length < 300) {
      return decoded;
    }
    return null;
  }
}
