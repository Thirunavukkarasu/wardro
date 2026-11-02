import 'package:flutter/foundation.dart';

/// The signed-in user as the app knows them.
///
/// `authId` is the identity-provider uid (Firebase `uid`). `id` is the
/// numeric backend user id used by the wardrobe endpoints.
@immutable
class AppUser {
  const AppUser({
    required this.id,
    required this.authId,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.imageUrl,
    this.emailVerified = false,
  });

  final int id;
  final String authId;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? imageUrl;
  final bool emailVerified;

  String get fullName => [firstName, lastName]
      .where((part) => part.trim().isNotEmpty)
      .join(' ');

  String get initials {
    final source = fullName.isNotEmpty ? fullName : email;
    final words = source.trim().split(RegExp(r'\s+'));
    final letters = words
        .where((word) => word.isNotEmpty)
        .take(2)
        .map((word) => word[0].toUpperCase())
        .join();
    return letters.isEmpty ? '?' : letters;
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'authId': authId,
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'phone': phone,
    'imageUrl': imageUrl,
    'emailVerified': emailVerified,
  };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: (json['id'] as num?)?.toInt() ?? 0,
    // `clerkId` is the pre-Firebase key; keep reading it for stored sessions.
    authId: json['authId'] as String? ?? json['clerkId'] as String? ?? '',
    firstName: json['firstName'] as String? ?? '',
    lastName: json['lastName'] as String? ?? '',
    email: json['email'] as String? ?? '',
    phone: json['phone'] as String?,
    imageUrl: json['imageUrl'] as String?,
    emailVerified: json['emailVerified'] as bool? ?? false,
  );
}
