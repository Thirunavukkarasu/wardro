import 'package:flutter/foundation.dart';

/// The signed-in user as the app knows them.
///
/// Mirrors the subset of Clerk's user shape the screens actually render, plus
/// the numeric backend id that wardrobe endpoints take.
@immutable
class AppUser {
  const AppUser({
    required this.id,
    required this.clerkId,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.imageUrl,
  });

  final int id;
  final String clerkId;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? imageUrl;

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
    'clerkId': clerkId,
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'phone': phone,
    'imageUrl': imageUrl,
  };

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: (json['id'] as num?)?.toInt() ?? 0,
    clerkId: json['clerkId'] as String? ?? '',
    firstName: json['firstName'] as String? ?? '',
    lastName: json['lastName'] as String? ?? '',
    email: json['email'] as String? ?? '',
    phone: json['phone'] as String?,
    imageUrl: json['imageUrl'] as String?,
  );
}
