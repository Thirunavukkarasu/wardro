import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../features/home/home_screen.dart';
import '../../features/items/add_item_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/wardrobes/all_items_screen.dart';

/// Public trigger around [ChangeNotifier.notifyListeners], which is protected.
class _ReloadSignal extends ChangeNotifier {
  void trigger() => notifyListeners();
}

///
/// Layout: a labelled Material 3 bottom bar for the three sections, with the
/// app's primary action — adding a photo — always one tap away as a FAB.
class MainShell extends StatefulWidget {
  const MainShell({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late int _index = widget.initialIndex;

  /// Fires after an item is added so both tabs refresh without being rebuilt.
  final _ReloadSignal _reload = _ReloadSignal();

  @override
  void dispose() {
    _reload.dispose();
    super.dispose();
  }

  Future<void> _addItem() async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const AddItemScreen()),
    );
    if (mounted) _reload.trigger();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          HomeScreen(reloadSignal: _reload),
          AllItemsScreen(reloadSignal: _reload),
          const ProfileScreen(),
        ],
      ),
      floatingActionButton: _index == 2
          ? null
          : FloatingActionButton(
              onPressed: _addItem,
              tooltip: 'Add item',
              child: const Icon(Icons.add_a_photo_outlined, size: 24),
            ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 18,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (index) => setState(() => _index = index),
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home_rounded),
                label: 'Home',
              ),
              NavigationDestination(
                icon: Icon(Icons.checkroom_outlined),
                selectedIcon: Icon(Icons.checkroom),
                label: 'Items',
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
