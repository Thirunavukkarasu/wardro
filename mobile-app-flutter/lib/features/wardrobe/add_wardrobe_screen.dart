import 'package:flutter/material.dart';

import '../../core/network/api_exception.dart';
import '../../core/network/api_scope.dart';
import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_button.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/hero_header.dart';

class AddWardrobeScreen extends StatefulWidget {
  const AddWardrobeScreen({super.key});

  @override
  State<AddWardrobeScreen> createState() => _AddWardrobeScreenState();
}

class _AddWardrobeScreenState extends State<AddWardrobeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    final api = ApiScope.of(context);

    try {
      await api.post(
        '/wardrobes',
        body: {
          'name': _nameController.text.trim(),
          'description': _descriptionController.text.trim(),
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Wardrobe added.')),
      );
      Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              HeroHeader(title: 'Add Wardrobe'),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AppTextField(
                        label: 'Name',
                        controller: _nameController,
                        placeholder: 'Enter name',
                        icon: Icons.checkroom_outlined,
                        textInputAction: TextInputAction.next,
                        validator: (value) => (value ?? '').trim().isEmpty
                            ? 'Give your wardrobe a name'
                            : null,
                      ),
                      AppTextField(
                        label: 'Description',
                        controller: _descriptionController,
                        placeholder: 'Enter description',
                        icon: Icons.notes_outlined,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _save(),
                      ),
                      const SizedBox(height: 16),
                      AppButton(
                        title: 'Add Wardrobe',
                        isLoading: _saving,
                        onPressed: _save,
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Saved to your account via the Wardro backend.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
