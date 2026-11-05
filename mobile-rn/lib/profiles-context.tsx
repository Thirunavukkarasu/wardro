import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api, ApiException, setApiProfileId } from "~/lib/api";
import { useAuth } from "~/lib/auth-context";
import { profileFromJson, type Profile } from "~/lib/types";

const STORAGE_PREFIX = "wardro.activeProfile.";

interface ProfilesContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  error: string | null;
  switchProfile: (id: number) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  createProfile: (input: {
    name: string;
    color?: string;
  }) => Promise<Profile | null>;
  updateProfile: (
    id: number,
    input: { name?: string; color?: string },
  ) => Promise<boolean>;
  deleteProfile: (id: number) => Promise<boolean>;
  clearError: () => void;
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof ApiException
    ? error.message
    : "Could not load your profiles.";
}

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeIdRef = useRef<number | null>(null);

  useEffect(() => {
    activeIdRef.current = activeProfile?.id ?? null;
  }, [activeProfile]);

  const loadProfiles = useCallback(async () => {
    const uid = user?.authId;
    if (!uid) return;

    setLoading(true);
    setError(null);
    setApiProfileId(null);

    try {
      const rows = await api.get<Record<string, unknown>[]>("/profiles");
      const list = (rows ?? []).map(profileFromJson);
      setProfiles(list);

      const stored = await AsyncStorage.getItem(`${STORAGE_PREFIX}${uid}`);
      const storedId = stored ? Number(stored) : null;
      const next =
        list.find((profile) => profile.id === storedId) ??
        list.find((profile) => profile.isDefault) ??
        list[0] ??
        null;

      setActiveProfile(next);
      setApiProfileId(next?.id ?? null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [user?.authId]);

  useEffect(() => {
    if (status === "signedIn") {
      loadProfiles();
      return;
    }

    if (status === "signedOut") {
      setProfiles([]);
      setActiveProfile(null);
      setApiProfileId(null);
      setLoading(false);
      setError(null);
    }
  }, [status, loadProfiles]);

  const switchProfile = useCallback(
    async (id: number) => {
      const next = profiles.find((profile) => profile.id === id);
      if (!next) return;

      setActiveProfile(next);
      setApiProfileId(next.id);
      setError(null);

      if (user?.authId) {
        await AsyncStorage.setItem(
          `${STORAGE_PREFIX}${user.authId}`,
          String(next.id),
        );
      }
    },
    [profiles, user?.authId],
  );

  const refreshProfiles = useCallback(async () => {
    const uid = user?.authId;
    if (!uid) return;

    try {
      const rows = await api.get<Record<string, unknown>[]>("/profiles");
      const list = (rows ?? []).map(profileFromJson);
      setProfiles(list);

      const currentId = activeIdRef.current;
      const next =
        list.find((profile) => profile.id === currentId) ??
        list.find((profile) => profile.isDefault) ??
        list[0] ??
        null;

      setActiveProfile(next);
      setApiProfileId(next?.id ?? null);
      setError(null);
    } catch (loadError) {
      setError(errorMessage(loadError));
    }
  }, [user?.authId]);

  const createProfile = useCallback(
    async (input: { name: string; color?: string }) => {
      setError(null);

      try {
        const rows = await api.post<Record<string, unknown>[]>("/profiles", {
          name: input.name,
          color: input.color,
        });
        const created = rows?.[0] ? profileFromJson(rows[0]) : null;
        await refreshProfiles();

        if (created) {
          setActiveProfile(created);
          setApiProfileId(created.id);
          if (user?.authId) {
            await AsyncStorage.setItem(
              `${STORAGE_PREFIX}${user.authId}`,
              String(created.id),
            );
          }
        }

        return created;
      } catch (createError) {
        setError(errorMessage(createError));
        return null;
      }
    },
    [refreshProfiles, user?.authId],
  );

  const updateProfile = useCallback(
    async (id: number, input: { name?: string; color?: string }) => {
      setError(null);

      try {
        await api.patch(`/profiles/${id}`, input);
        await refreshProfiles();
        return true;
      } catch (updateError) {
        setError(errorMessage(updateError));
        return false;
      }
    },
    [refreshProfiles],
  );

  const deleteProfile = useCallback(
    async (id: number) => {
      setError(null);

      try {
        await api.delete(`/profiles/${id}`);
        await refreshProfiles();
        return true;
      } catch (deleteError) {
        setError(errorMessage(deleteError));
        return false;
      }
    },
    [refreshProfiles],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<ProfilesContextValue>(
    () => ({
      profiles,
      activeProfile,
      loading,
      error,
      switchProfile,
      refreshProfiles,
      createProfile,
      updateProfile,
      deleteProfile,
      clearError,
    }),
    [
      profiles,
      activeProfile,
      loading,
      error,
      switchProfile,
      refreshProfiles,
      createProfile,
      updateProfile,
      deleteProfile,
      clearError,
    ],
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
}

export function useProfiles(): ProfilesContextValue {
  const context = useContext(ProfilesContext);
  if (!context) {
    throw new Error("useProfiles must be used inside a ProfilesProvider.");
  }
  return context;
}
