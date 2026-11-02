import 'dart:typed_data';

/// A photo chosen or captured by the user.
///
/// Bytes are kept so the image renders identically on mobile and web; the
/// path is kept only to send to the backend as an opaque `photoUri` string.
class PickedPhoto {
  const PickedPhoto({required this.bytes, this.path});

  final Uint8List bytes;
  final String? path;
}
