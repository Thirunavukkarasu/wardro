import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/app_colors.dart';
import '../models/picked_photo.dart';

/// Photo capture step used by the "add item" flow.
///
/// The React Native app renders a live `expo-camera` preview. Here the capture
/// is delegated to the platform camera/gallery (which on web is a file
/// dialog), so the widget compiles and behaves the same on iOS, Android and
/// web. Swap in the `camera` plugin if a live preview is needed.
class PhotoCaptureField extends StatelessWidget {
  const PhotoCaptureField({
    super.key,
    required this.photo,
    required this.onChanged,
    this.height = 260,
  });

  final PickedPhoto? photo;
  final ValueChanged<PickedPhoto?> onChanged;
  final double height;

  Future<void> _pick(BuildContext context, ImageSource source) async {
    try {
      final picked = await ImagePicker().pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1600,
      );
      if (picked == null) return;
      final bytes = await picked.readAsBytes();
      onChanged(
        PickedPhoto(
          bytes: bytes,
          path: picked.path,
          mimeType: picked.mimeType,
        ),
      );
    } on PlatformException catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            error.code == 'camera_access_denied'
                ? 'Camera access was denied. Enable it in Settings.'
                : 'Could not open the ${source.name}.',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (photo != null) {
      return Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.memory(
              photo!.bytes,
              height: height,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => onChanged(null),
            icon: const Icon(Icons.refresh),
            label: const Text('Retake photo'),
          ),
        ],
      );
    }

    return Container(
      height: height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.photo_camera_outlined,
            size: 56,
            color: AppColors.textMuted,
          ),
          const SizedBox(height: 12),
          const Text(
            'Add a photo of this item',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FilledButton.icon(
                onPressed: () => _pick(context, ImageSource.camera),
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Snap'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => _pick(context, ImageSource.gallery),
                icon: const Icon(Icons.photo_library_outlined),
                label: const Text('Gallery'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
