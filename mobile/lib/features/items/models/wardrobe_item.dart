/// A garment row as returned by `GET /wardrobeItems/:wardrobeId`.
class WardrobeItem {
  const WardrobeItem({
    required this.id,
    required this.wardrobeId,
    required this.userId,
    required this.itemName,
    this.photoUri = '',
    this.brand = '',
    this.category = '',
    this.color = '',
    this.size = '',
    this.state = 'newly_purchased',
    this.price,
    this.purchaseDate,
    this.expiryDate,
    this.createdAt,
  });

  final int id;
  final int wardrobeId;
  final String userId;
  final String itemName;
  final String photoUri;
  final String brand;
  final String category;
  final String color;
  final String size;
  final String state;
  final double? price;
  final DateTime? purchaseDate;
  final DateTime? expiryDate;
  final DateTime? createdAt;

  /// Only absolute URLs can be rendered again on a later visit. The backend
  /// currently stores device-local paths / blob URLs, which are unusable as
  /// images outside the session that created them.
  String? get photoUrl {
    final uri = photoUri.trim();
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    return null;
  }

  factory WardrobeItem.fromJson(Map<String, dynamic> json) => WardrobeItem(
    id: (json['id'] as num?)?.toInt() ?? 0,
    wardrobeId: (json['wardrobeId'] as num?)?.toInt() ?? 0,
    userId: json['userId']?.toString() ?? '',
    itemName: json['itemName'] as String? ?? 'Untitled item',
    photoUri: json['photoUri'] as String? ?? '',
    brand: json['brand'] as String? ?? '',
    category: json['category'] as String? ?? '',
    color: json['color'] as String? ?? '',
    size: json['size'] as String? ?? '',
    state: json['state'] as String? ?? 'newly_purchased',
    price: _toDouble(json['price']),
    purchaseDate: _toDate(json['purchaseDate']),
    expiryDate: _toDate(json['expiryDate']),
    createdAt: _toDate(json['createdAt']),
  );

  static double? _toDouble(Object? value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  static DateTime? _toDate(Object? value) {
    if (value == null) return null;
    return DateTime.tryParse(value.toString());
  }
}
