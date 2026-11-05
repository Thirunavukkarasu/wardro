import { router, useLocalSearchParams } from "expo-router";
import { FileText, Shirt } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import CustomButton from "~/components/CustomButton";
import FormScreen from "~/components/FormScreen";
import InputField from "~/components/InputField";
import { api, ApiException } from "~/lib/api";
import { useProfiles } from "~/lib/profiles-context";

export default function AddWardrobeScreen() {
  const { activeProfile } = useProfiles();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    description?: string;
  }>();
  const isEditing = Boolean(params.id);

  const [name, setName] = useState(params.name ?? "");
  const [description, setDescription] = useState(params.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Give your wardrobe a name.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      if (isEditing) {
        await api.patch(`/wardrobes/${params.id}`, payload);
      } else {
        await api.post("/wardrobes", payload);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(root)/(tabs)/today");
      }
    } catch (saveError) {
      setError(
        saveError instanceof ApiException
          ? saveError.message
          : "Could not save the wardrobe.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen
      title={isEditing ? "Edit Wardrobe" : "Add Wardrobe"}
      subtitle={
        isEditing
          ? "Update this collection"
          : activeProfile
            ? `Add to ${activeProfile.name}'s wardrobe`
            : "Create a collection"
      }
      footer={
        <View>
          {error ? (
            <Text className="mb-2 text-sm font-medium text-danger">
              {error}
            </Text>
          ) : null}
          <CustomButton
            title={isEditing ? "Save Changes" : "Add Wardrobe"}
            isLoading={saving}
            onPress={save}
          />
        </View>
      }
    >
      <InputField
        label="Name"
        placeholder="Enter name"
        icon={<Shirt size={20} color="#94A3B8" />}
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError(null);
        }}
      />

      <InputField
        label="Description"
        placeholder="Enter description"
        icon={<FileText size={20} color="#94A3B8" />}
        value={description}
        onChangeText={(value) => {
          setDescription(value);
          setError(null);
        }}
        onSubmitEditing={save}
      />

      <Text className="mt-3 text-center text-xs text-ink-muted">
        {isEditing
          ? "Changes are saved to your account."
          : activeProfile
            ? `Saved to ${activeProfile.name}'s profile.`
            : "Saved to your account via the Wardro backend."}
      </Text>
    </FormScreen>
  );
}
