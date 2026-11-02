import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/utils/formatters.dart';
import '../../shared/widgets/app_pill.dart';
import '../../shared/widgets/circle_action.dart';
import '../../shared/widgets/status_views.dart';
import '../auth/auth_scope.dart';
import '../wardrobe/add_wardrobe_screen.dart';
import '../wardrobe/models/wardrobe.dart';
import '../wardrobe/wardrobe_items_screen.dart';

/// "Home" tab: a compact summary followed by one card per wardrobe.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.reloadSignal});

  /// Fired by the shell after adding an item elsewhere.
  final Listenable? reloadSignal;

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

  double get _totalValue =>
      _wardrobes.fold(0.0, (sum, wardrobe) => sum + wardrobe.totalValue);

  @override
  void initState() {
    super.initState();
    widget.reloadSignal?.addListener(_load);
  }

  @override
  void dispose() {
    widget.reloadSignal?.removeListener(_load);
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _api = ApiScope.of(context);
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final raw = await _api.get('/wardrobes/summary');
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
    final firstName = AuthScope.of(context).user?.firstName ?? '';

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 120),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (firstName.isNotEmpty)
                        Text(
                          'Hey, $firstName',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      const SizedBox(height: 2),
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
            const SizedBox(height: 16),
            _SummaryStrip(
              wardrobes: _wardrobes.length,
              items: _totalItems,
              value: _totalValue,
              loading: _loading,
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Text(
                  'Wardrobes',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                if (!_loading && _error == null && _wardrobes.isNotEmpty)
                  Text(
                    '${_wardrobes.length} total',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
            const SizedBox(height: 10),
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
              for (final wardrobe in _wardrobes)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _WardrobeCard(
                    wardrobe: wardrobe,
                    onTap: () => _openWardrobe(wardrobe),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _SummaryStrip extends StatelessWidget {
  const _SummaryStrip({
    required this.wardrobes,
    required this.items,
    required this.value,
    required this.loading,
  });

  final int wardrobes;
  final int items;
  final double value;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _Metric(
              label: 'WARDROBES',
              value: loading ? '–' : '$wardrobes',
            ),
          ),
          const _MetricDivider(),
          Expanded(
            child: _Metric(label: 'ITEMS', value: loading ? '–' : '$items'),
          ),
          const _MetricDivider(),
          Expanded(
            child: _Metric(
              label: 'VALUE',
              value: loading ? '–' : formatPrice(value),
            ),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.9,
            color: AppColors.textMuted,
          ),
        ),
        const SizedBox(height: 3),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricDivider extends StatelessWidget {
  const _MetricDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 1, height: 28, color: AppColors.border);
  }
}

class _WardrobeCard extends StatelessWidget {
  const _WardrobeCard({required this.wardrobe, required this.onTap});

  final Wardrobe wardrobe;
  final VoidCallback onTap;

  Widget _cover() {
    final fallback = Container(
      decoration: const BoxDecoration(gradient: AppColors.brandGradient),
      child: const Icon(Icons.checkroom, color: Colors.white, size: 22),
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
    final subtitle = wardrobe.description.isNotEmpty
        ? wardrobe.description
        : (wardrobe.totalValue > 0
              ? formatPrice(wardrobe.totalValue)
              : 'No items yet');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(width: 48, height: 48, child: _cover()),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            wardrobe.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        AppPill(
                          label: '${wardrobe.itemCount}',
                          icon: Icons.dry_cleaning,
                          color: wardrobe.itemCount == 0
                              ? AppColors.textMuted
                              : AppColors.primary,
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right,
                size: 18,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
