import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/models/picked_photo.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_date_field.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/photo_capture_field.dart';
import '../wardrobe/models/wardrobe.dart';

/// Photo-first garment capture. Mirrors `add-wardrobe-items.tsx`, with a
/// wardrobe picker added because the backend requires `wardrobeId`.
class AddItemScreen extends StatefulWidget {
  const AddItemScreen({super.key, this.initialWardrobeId});

  /// Preselects a wardrobe when the screen is opened from a wardrobe detail.
  final int? initialWardrobeId;

  @override
  State<AddItemScreen> createState() => _AddItemScreenState();
}

class _AddItemScreenState extends State<AddItemScreen> {
  late final ApiClient _api;
  bool _started = false;

  PickedPhoto? _photo;
  final _itemName = TextEditingController();
  final _price = TextEditingController();
  final _brand = TextEditingController();
  final _category = TextEditingController();
  final _color = TextEditingController();
  final _size = TextEditingController();
  DateTime? _purchaseDate;
  DateTime? _expiryDate;

  List<Wardrobe> _wardrobes = const [];
  int? _wardrobeId;
  bool _loadingWardrobes = true;
  String? _wardrobesError;
  bool _saving = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _api = ApiScope.of(context);
    _loadWardrobes();
  }

  @override
  void dispose() {
    _itemName.dispose();
    _price.dispose();
    _brand.dispose();
    _category.dispose();
    _color.dispose();
    _size.dispose();
    super.dispose();
  }

  Future<void> _loadWardrobes() async {
    setState(() {
      _loadingWardrobes = true;
      _wardrobesError = null;
    });

    try {
      final raw = await _api.get('/wardrobes');
      final list = (raw as List<dynamic>? ?? const [])
          .map((item) => Wardrobe.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      if (!mounted) return;
      final preferred = widget.initialWardrobeId;
      final hasPreferred =
          preferred != null && list.any((wardrobe) => wardrobe.id == preferred);
      setState(() {
        _wardrobes = list;
        _wardrobeId = hasPreferred
            ? preferred
            : (list.isEmpty ? null : list.first.id);
        _loadingWardrobes = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _wardrobesError = error.message;
        _loadingWardrobes = false;
      });
    }
  }

  Map<String, dynamic> _buildPayload(String? photoUri) {
    final payload = <String, dynamic>{
      'itemName': _itemName.text.trim(),
      'wardrobeId': _wardrobeId,
    };

    void addIfNotEmpty(String key, String value) {
      final trimmed = value.trim();
      if (trimmed.isNotEmpty) payload[key] = trimmed;
    }

    addIfNotEmpty('photoUri', photoUri ?? '');
    addIfNotEmpty('brand', _brand.text);
    addIfNotEmpty('category', _category.text);
    addIfNotEmpty('color', _color.text);
    addIfNotEmpty('size', _size.text);

    final price = double.tryParse(_price.text.trim());
    if (price != null) payload['price'] = price;
    if (_purchaseDate != null) {
      payload['purchaseDate'] = _purchaseDate!.toIso8601String();
    }
    if (_expiryDate != null) {
      payload['expiryDate'] = _expiryDate!.toIso8601String();
    }

    return payload;
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();

    if (_itemName.text.trim().isEmpty) {
      _showMessage('Give the item a name.');
      return;
    }
    if (_wardrobeId == null) {
      _showMessage('Create a wardrobe before adding items.');
      return;
    }

    setState(() => _saving = true);

    try {
      // Photos are stored as files by the backend; the item only keeps the
      // resulting absolute URL so it renders on every device later.
      String? photoUri;
      if (_photo != null) {
        photoUri = await _api.uploadPhoto(_photo!);
      }

      await _api.post('/wardrobeItems', body: _buildPayload(photoUri));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Item saved.')),
      );
      Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      _showMessage(error.message);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Item')),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Add New Clothing Item',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              PhotoCaptureField(
                photo: _photo,
                onChanged: (photo) => setState(() => _photo = photo),
              ),
              const SizedBox(height: 20),
              _WardrobePicker(
                loading: _loadingWardrobes,
                error: _wardrobesError,
                wardrobes: _wardrobes,
                selectedId: _wardrobeId,
                onChanged: (id) => setState(() => _wardrobeId = id),
                onRetry: _loadWardrobes,
              ),
              AppTextField(
                label: 'Item Name',
                controller: _itemName,
                placeholder: 'Enter item name',
                icon: Icons.label_outline,
              ),
              AppDateField(
                label: 'Purchase Date',
                value: _purchaseDate,
                onChanged: (date) => setState(() => _purchaseDate = date),
              ),
              AppDateField(
                label: 'Expiry Date',
                value: _expiryDate,
                onChanged: (date) => setState(() => _expiryDate = date),
              ),
              AppTextField(
                label: 'Price',
                controller: _price,
                placeholder: 'Enter price',
                icon: Icons.payments_outlined,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                ],
              ),
              AppTextField(
                label: 'Brand',
                controller: _brand,
                placeholder: 'Enter brand',
                icon: Icons.storefront_outlined,
              ),
              AppTextField(
                label: 'Category',
                controller: _category,
                placeholder: 'Enter category',
                icon: Icons.category_outlined,
              ),
              AppTextField(
                label: 'Color',
                controller: _color,
                placeholder: 'Enter color',
                icon: Icons.palette_outlined,
              ),
              AppTextField(
                label: 'Size',
                controller: _size,
                placeholder: 'Enter size',
                icon: Icons.straighten_outlined,
              ),
              const SizedBox(height: 20),
              AppButton(
                title: 'Save Item',
                isLoading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WardrobePicker extends StatelessWidget {
  const _WardrobePicker({
    required this.loading,
    required this.error,
    required this.wardrobes,
    required this.selectedId,
    required this.onChanged,
    required this.onRetry,
  });

  final bool loading;
  final String? error;
  final List<Wardrobe> wardrobes;
  final int? selectedId;
  final ValueChanged<int?> onChanged;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 10),
            Text('Loading wardrobes…'),
          ],
        ),
      );
    }

    if (error != null) {
      return Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: AppColors.danger.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Wardrobes unavailable: $error',
                style: const TextStyle(fontSize: 13),
              ),
            ),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (wardrobes.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: AppColors.warning.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text(
          'No wardrobes found. Add a wardrobe first, then come back.',
          style: TextStyle(fontSize: 13),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: DropdownButtonFormField<int>(
        initialValue: selectedId,
        decoration: const InputDecoration(
          labelText: 'Wardrobe',
          prefixIcon: Icon(Icons.checkroom_outlined, size: 22),
        ),
        items: [
          for (final wardrobe in wardrobes)
            DropdownMenuItem(value: wardrobe.id, child: Text(wardrobe.name)),
        ],
        onChanged: onChanged,
      ),
    );
  }
}
