import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/circle_action.dart';
import '../../shared/widgets/status_views.dart';
import '../wardrobe/add_wardrobe_screen.dart';
import '../wardrobe/models/wardrobe.dart';
import '../wardrobe/wardrobe_items_screen.dart';

/// "Your Wardrobes" tab: a stats header plus one tappable card per wardrobe.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final ApiClient _api;
  bool _started = false;
  bool _loading = true;
  String? _error;
  List<Wardrobe> _wardrobes = const [];

  int get _totalItems =>
      _wardrobes.fold(0, (sum, wardrobe) => sum + wardrobe.itemCount);

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
      final raw = await _api.get(
        '/wardrobes/${AppConfig.demoUserId}/summary',
      );
      final list = (raw as List<dynamic>? ?? const [])
          .map((item) => Wardrobe.fromJson(item as Map<String, dynamic>))
          .toList(growable: false);
      if (!mounted) return;
      setState(() {
        _wardrobes = list;
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

  Future<void> _openAddWardrobe() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const AddWardrobeScreen()),
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
                        'YOUR COLLECTION',
                        style: TextStyle(
                          fontSize: 11,
                          letterSpacing: 1.4,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Your Wardrobes',
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                    ],
                  ),
                ),
                CircleAction(
                  icon: Icons.add,
                  tooltip: 'Add wardrobe',
                  onTap: _openAddWardrobe,
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    label: 'Wardrobes',
                    value: '${_wardrobes.length}',
                    icon: Icons.checkroom,
                    color: AppColors.primary,
                    loading: _loading,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatTile(
                    label: 'Items',
                    value: '$_totalItems',
                    icon: Icons.dry_cleaning,
                    color: const Color(0xFF8B5CF6),
                    loading: _loading,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            if (_loading)
              const LoadingView(message: 'Loading your wardrobes…')
            else if (_error != null)
              ErrorView(
                title: "Couldn't load your wardrobes",
                message: _error!,
                detail: 'API: ${AppConfig.apiBaseUrl}',
                onRetry: _load,
              )
            else if (_wardrobes.isEmpty)
              EmptyView(
                icon: Icons.checkroom_outlined,
                title: 'No wardrobes yet',
                message:
                    'Create your first wardrobe to start organising your clothes.',
                actionLabel: 'Add Wardrobe',
                onAction: _openAddWardrobe,
              )
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 1000
                      ? 3
                      : constraints.maxWidth >= 680
                      ? 2
                      : 1;
                  const gap = 14.0;
                  final width =
                      (constraints.maxWidth - gap * (columns - 1)) / columns;
                  return Wrap(
                    spacing: gap,
                    runSpacing: gap,
                    children: [
                      for (final wardrobe in _wardrobes)
                        SizedBox(
                          width: width,
                          child: _WardrobeCard(
                            wardrobe: wardrobe,
                            onTap: () => _openWardrobe(wardrobe),
                          ),
                        ),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}


class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.loading,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF101828).withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  loading ? '–' : value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WardrobeCard extends StatelessWidget {
  const _WardrobeCard({required this.wardrobe, required this.onTap});

  final Wardrobe wardrobe;
  final VoidCallback onTap;

  Widget _cover() {
    final fallback = Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF4CA6FF), AppColors.primary],
        ),
      ),
      child: const Icon(Icons.checkroom, color: Colors.white, size: 26),
    );

    final url = wardrobe.coverPhotoUrl;
    if (url == null) return fallback;

    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => fallback,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEmpty = wardrobe.itemCount == 0;

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF101828).withValues(alpha: 0.04),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: SizedBox(
                  width: 54,
                  height: 54,
                  child: _cover(),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      wardrobe.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (wardrobe.description.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        wardrobe.description,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                    const SizedBox(height: 9),
                    Row(
                      children: [
                        AppPill(
                          label:
                              '${wardrobe.itemCount} ${wardrobe.itemCount == 1 ? 'item' : 'items'}',
                          icon: Icons.dry_cleaning,
                          color: isEmpty
                              ? AppColors.textMuted
                              : AppColors.primary,
                        ),
                        if (isEmpty) ...[
                          const SizedBox(width: 8),
                          const Text(
                            'Empty',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
