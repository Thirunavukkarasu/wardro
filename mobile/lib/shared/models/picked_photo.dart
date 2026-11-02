import 'dart:typed_data';

/// A photo chosen or captured by the user.
///
/// Bytes are kept so the image renders identically on mobile and web; the
/// path is only used to infer the file type before uploading.
class PickedPhoto {
  const PickedPhoto({required this.bytes, this.path, this.mimeType});

  final Uint8List bytes;
  final String? path;
  final String? mimeType;

  String get resolvedMimeType {
    final explicit = mimeType?.toLowerCase();
    if (explicit != null && explicit.startsWith('image/')) return explicit;

    final lower = (path ?? '').toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  }

  String get filename {
    final extension = switch (resolvedMimeType) {
      'image/png' => 'png',
      'image/webp' => 'webp',
      'image/gif' => 'gif',
      _ => 'jpg',
    };
    return 'upload.$extension';
  }
}
