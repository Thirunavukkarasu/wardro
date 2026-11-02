import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/circle_action.dart';
import '../../shared/widgets/status_views.dart';
import '../items/add_item_screen.dart';
import '../items/models/wardrobe_item.dart';
import '../items/widgets/item_card.dart';
import '../wardrobe/models/wardrobe.dart';
import '../wardrobe/wardrobe_items_screen.dart';

/// "All Items" tab: every garment the user owns, grouped by wardrobe.
class AllItemsScreen extends StatefulWidget {
  const AllItemsScreen({super.key});

  @override
  State<AllItemsScreen> createState() => _AllItemsScreenState();
}

class _AllItemsScreenState extends State<AllItemsScreen> {
  late final ApiClient _api;
  bool _started = false;
  bool _loading = true;
  String? _error;
  List<Wardrobe> _wardrobes = const [];
  List<WardrobeItem> _items = const [];
  Map<int, List<WardrobeItem>> _byWardrobe = const {};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _api = ApiScope.of(context);
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final results = await Future.wait<dynamic>([
        _api.get('/wardrobes/${AppConfig.demoUserId}/summary'),
        _api.get('/wardrobeItems/user/${AppConfig.demoUserId}'),
      ]);

      final wardrobes = (results[0] as List<dynamic>? ?? const [])
          .map((item) => Wardrobe.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      final items = (results[1] as List<dynamic>? ?? const [])
          .map((item) => WardrobeItem.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);

      final grouped = <int, List<WardrobeItem>>{};
      for (final item in items) {
        grouped.putIfAbsent(item.wardrobeId, () => []).add(item);
      }

      if (!mounted) return;
      setState(() {
        _wardrobes = wardrobes;
        _items = items;
        _byWardrobe = grouped;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  Future<void> _addItem() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const AddItemScreen()),
    );
    if (mounted) _load();
  }

  Future<void> _openWardrobe(Wardrobe wardrobe) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => WardrobeItemsScreen(wardrobe: wardrobe),
      ),
    );
    if (mounted) _load();
  }

  @override
  Widget build(BuildContext context) {
    final populated = _wardrobes
        .where((wardrobe) => (_byWardrobe[wardrobe.id] ?? const []).isNotEmpty)
        .toList(growable: false);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'EVERYTHING YOU OWN',
                        style: TextStyle(
                          fontSize: 11,
                          letterSpacing: 1.4,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'All Items',
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                    ],
                  ),
                ),
                CircleAction(
                  icon: Icons.add,
                  tooltip: 'Add item',
                  onTap: _addItem,
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (!_loading && _error == null)
              Text(
                '${_items.length} ${_items.length == 1 ? 'item' : 'items'} across ${populated.length} ${populated.length == 1 ? 'wardrobe' : 'wardrobes'}',
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            const SizedBox(height: 20),
            if (_loading)
              const LoadingView(message: 'Loading your items…')
            else if (_error != null)
              ErrorView(
                title: "Couldn't load your items",
                message: _error!,
                detail: 'API: ${AppConfig.apiBaseUrl}',
                onRetry: _load,
              )
            else if (_items.isEmpty)
              EmptyView(
                icon: Icons.dry_cleaning_outlined,
                title: 'No items yet',
                message:
                    'Snap a photo of a garment and it will show up here, grouped by wardrobe.',
                actionLabel: 'Add Item',
                onAction: _addItem,
              )
            else
              for (final wardrobe in populated) ...[
                _WardrobeSectionHeader(
                  wardrobe: wardrobe,
                  itemCount: _byWardrobe[wardrobe.id]!.length,
                  onTap: () => _openWardrobe(wardrobe),
                ),
                const SizedBox(height: 10),
                for (final item in _byWardrobe[wardrobe.id]!)
                  ItemCard(item: item),
                const SizedBox(height: 12),
              ],
          ],
        ),
      ),
    );
  }
}

class _WardrobeSectionHeader extends StatelessWidget {
  const _WardrobeSectionHeader({
    required this.wardrobe,
    required this.itemCount,
    required this.onTap,
  });

  final Wardrobe wardrobe;
  final int itemCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            const Icon(
              Icons.checkroom,
              size: 20,
              color: AppColors.primary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                wardrobe.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            AppPill(
              label: '$itemCount',
              color: AppColors.textSecondary,
            ),
            const Icon(
              Icons.chevron_right,
              size: 20,
              color: AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}

