/// A wardrobe row as returned by `GET /wardrobes/summary`.
class Wardrobe {
  const Wardrobe({
    required this.id,
    required this.userId,
    required this.name,
    required this.description,
    this.itemCount = 0,
    this.totalValue = 0,
    this.coverPhotoUri = '',
  });

  final int id;
  final String userId;
  final String name;
  final String description;
  final int itemCount;
  final double totalValue;
  final String coverPhotoUri;

  /// The cover photo is only renderable when the backend stored a real URL.
  String? get coverPhotoUrl {
    final uri = coverPhotoUri.trim();
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    return null;
  }

  factory Wardrobe.fromJson(Map<String, dynamic> json) => Wardrobe(
    id: (json['id'] as num?)?.toInt() ?? 0,
    userId: json['userId']?.toString() ?? '',
    name: json['name'] as String? ?? '',
    description: json['description'] as String? ?? '',
    itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
    totalValue: (json['totalValue'] as num?)?.toDouble() ?? 0,
    coverPhotoUri: json['coverPhotoUri'] as String? ?? '',
  );
}
