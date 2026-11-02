/// A wardrobe row as returned by `GET /wardrobes/:userId/summary`.
class Wardrobe {
  const Wardrobe({
    required this.id,
    required this.userId,
    required this.name,
    required this.description,
    this.itemCount = 0,
  });

  final int id;
  final int userId;
  final String name;
  final String description;
  final int itemCount;

  factory Wardrobe.fromJson(Map<String, dynamic> json) => Wardrobe(
    id: (json['id'] as num?)?.toInt() ?? 0,
    userId: (json['userId'] as num?)?.toInt() ?? 0,
    name: json['name'] as String? ?? '',
    description: json['description'] as String? ?? '',
    itemCount: (json['itemCount'] as num?)?.toInt() ?? 0,
  );
}
