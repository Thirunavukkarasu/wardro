import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import 'api_exception.dart';

/// Thin wrapper over `package:http` that understands the backend's
/// `{ "data": ... }` response envelope.
///
/// The screens depend on this interface rather than on `http` directly, so
/// swapping in `dio` or adding an auth interceptor later stays local to this
/// file.
class ApiClient {
  ApiClient({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      _baseUrl = baseUrl ?? AppConfig.apiBaseUrl;

  final http.Client _client;
  final String _baseUrl;
  final Map<String, String> _defaultHeaders = const {
    'Content-Type': 'application/json',
    // ngrok serves an interstitial HTML page to browser-like clients.
    'ngrok-skip-browser-warning': 'true',
  };

  Future<dynamic> get(String path) {
    return _send(() => _client.get(_uri(path), headers: _defaultHeaders));
  }

  Future<dynamic> post(String path, {Object? body}) {
    return _send(
      () => _client.post(
        _uri(path),
        headers: _defaultHeaders,
        body: jsonEncode(body ?? const <String, dynamic>{}),
      ),
    );
  }

  void dispose() => _client.close();

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
