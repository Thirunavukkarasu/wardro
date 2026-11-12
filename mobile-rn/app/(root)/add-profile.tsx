import { router, useLocalSearchParams } from "expo-router";
import { Trash2, User } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import ConfirmDialog from "~/components/ConfirmDialog";
import CustomButton from "~/components/CustomButton";
import FormScreen from "~/components/FormScreen";
import InputField from "~/components/InputField";
import { useProfiles } from "~/lib/profiles-context";
import { FIELD_LIMITS, nameError } from "~/lib/validation";
import {
  wardroColors,
  wardroProfileColors,
} from "~/src/theme/colors";

export default function AddProfileScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    color?: string;
  }>();
  const isEditing = Boolean(params.id);

  const {
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    error,
    clearError,
  } = useProfiles();

  const [name, setName] = useState(params.name ?? "");
  const [color, setColor] = useState(
    params.color ?? wardroProfileColors[0],
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canDelete = isEditing && profiles.length > 1;
  const message = localError ?? error;

  const save = async () => {
    setLocalError(null);

    const nameIssue = nameError(name, "Profile name");
    if (nameIssue) {
      setLocalError(nameIssue);
      return;
    }

    setSaving(true);

    const saved =
      isEditing && params.id
        ? await updateProfile(Number(params.id), {
            name: name.trim(),
            color,
          })
        : Boolean(await createProfile({ name: name.trim(), color }));

    setSaving(false);

    if (saved) {
      if (router.canGoBack()) router.back();
      else router.replace("/(root)/(tabs)/today");
    }
  };

  const remove = async () => {
    if (!isEditing || !params.id) return;

    setDeleting(true);
    const deleted = await deleteProfile(Number(params.id));
    setDeleting(false);
    setConfirmVisible(false);

    if (deleted) {
      if (router.canGoBack()) router.back();
      else router.replace("/(root)/(tabs)/profile");
    }
  };

  return (
    <>
      <FormScreen
        title={isEditing ? "Edit Profile" : "Add Profile"}
        subtitle={
          isEditing
            ? "Update this profile"
            : "A family member or wardrobe context"
        }
        footer={
          <View>
            {message ? (
              <Text className="mb-2 text-sm font-medium text-danger">
                {message}
              </Text>
            ) : null}
            <CustomButton
              title={isEditing ? "Save Changes" : "Add Profile"}
              isLoading={saving}
              onPress={save}
            />
          </View>
        }
      >
        <InputField
          label="Name"
          placeholder="e.g. Swati, Kids, Work capsule"
          icon={<User size={20} color={wardroColors.text.disabled} />}
          maxLength={FIELD_LIMITS.name}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setLocalError(null);
            clearError();
          }}
          onSubmitEditing={save}
        />

        <View className="mt-4">
          <Text className="mb-2 text-[13.5px] font-semibold text-ink">
            Avatar colour
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {wardroProfileColors.map((option) => {
              const selected = option === color;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose colour ${option}`}
                  onPress={() => setColor(option)}
                  className={`h-11 w-11 items-center justify-center rounded-full border-2 ${
                    selected ? "border-ink" : "border-transparent"
                  }`}
                >
                  <View
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: option }}
                  />
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-2 text-xs text-ink-secondary">
            Initials are shown on the avatar. Photos can be added later.
          </Text>
        </View>

        {isEditing ? (
          <View className="mt-8 rounded-[16px] border border-danger/20 bg-danger/5 p-4">
            <Text className="text-sm font-semibold text-ink">
              Delete this profile
            </Text>
            <Text className="mt-1 text-xs leading-5 text-ink-secondary">
              {canDelete
                ? "Its wardrobes, items and photos will be removed permanently."
                : "At least one profile is required, so the last profile cannot be deleted."}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete profile"
              disabled={!canDelete || deleting}
              onPress={() => setConfirmVisible(true)}
              className={`mt-3 flex-row items-center self-start rounded-full px-4 py-2 ${
                canDelete ? "bg-danger active:opacity-80" : "bg-danger/40"
              }`}
            >
              <Trash2 size={16} color={wardroColors.surface} />
              <Text className="ml-2 text-xs font-bold text-red-100">
                {deleting ? "Deleting…" : "Delete Profile"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </FormScreen>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete profile?"
        message={`"${name}" and all of its wardrobes, items and photos will be removed permanently.`}
        busy={deleting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={remove}
      />
    </>
  );
}
