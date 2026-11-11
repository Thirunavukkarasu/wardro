import { router, useLocalSearchParams } from "expo-router";
import { Globe, RotateCw, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

import { api, ApiException } from "~/lib/api";
import type { ItemDraft } from "~/lib/types";
import { wardroColors } from "~/src/theme/colors";

const STORES = [
  { label: "H&M", url: "https://www2.hm.com/en_in/index.html" },
  { label: "Zara", url: "https://www.zara.com/in/" },
  { label: "Amazon", url: "https://www.amazon.in/" },
];

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * In-app browser for adding an item from a store page. "Add this page" sends
 * the current URL through the existing importer; "Capture" sends the visible
 * page image through the vision draft. Both hand a draft to the item form.
 */
export default function WebImportScreen() {
  const params = useLocalSearchParams<{ wardrobeId?: string }>();
  const webRef = useRef<WebView>(null);
  const captureViewRef = useRef<View | null>(null);

  const [address, setAddress] = useState("");
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [drafting, setDrafting] = useState<"page" | "capture" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openItemForm = (draft: ItemDraft) => {
    router.replace({
      pathname: "/(root)/add-wardrobe-items",
      params: {
        ...(params.wardrobeId ? { wardrobeId: params.wardrobeId } : {}),
        draft: JSON.stringify(draft),
      },
    });
  };

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(root)/(tabs)/today");
    }
  };

  const go = (value: string) => {
    const next = normalizeUrl(value);
    if (!next) {
      setError("Enter a valid web address.");
      return;
    }
    setError(null);
    setAddress(next);
    if (next === currentUrl) {
      webRef.current?.reload();
    } else {
      setCurrentUrl(next);
    }
  };

  const addThisPage = async () => {
    const url = normalizeUrl(address) ?? currentUrl;
    if (!url) {
      setError("Open a product page first.");
      return;
    }

    setDrafting("page");
    setError(null);
    try {
      const draft = await api.draftItem({ url });
      openItemForm(draft);
    } catch (draftError) {
      setError(
        draftError instanceof ApiException
          ? draftError.message
          : "Could not read that page. Try Capture instead.",
      );
    } finally {
      setDrafting(null);
    }
  };

  const capturePage = async () => {
    if (Platform.OS === "web") {
      setError("Capture isn't available on web. Use Add this page instead.");
      return;
    }
    if (!currentUrl) {
      setError("Open a product page first.");
      return;
    }

    setDrafting("capture");
    setError(null);
    try {
      const { captureRef } = await import("react-native-view-shot");
      const imageBase64 = await captureRef(captureViewRef, {
        format: "jpg",
        quality: 0.85,
        result: "base64",
      });
      const draft = await api.draftItem({
        imageBase64,
        contentType: "image/jpeg",
      });
      openItemForm(draft);
    } catch (draftError) {
      setError(
        draftError instanceof ApiException
          ? draftError.message
          : "Could not read that screen. Try Add this page instead.",
      );
    } finally {
      setDrafting(null);
    }
  };

  // Let the Android back button walk the page history before leaving.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack && webRef.current) {
          webRef.current.goBack();
          return true;
        }
        return false;
      },
    );

    return () => subscription.remove();
  }, [canGoBack]);

  const busy = drafting !== null;
  const canSubmit = Boolean(normalizeUrl(address) ?? currentUrl);

  return (
    <SafeAreaView
      edges={["top", "bottom", "left", "right"]}
      className="flex-1 bg-white"
    >
      <View className="h-14 flex-row items-center px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
        >
          <X size={22} color={wardroColors.text.primary} />
        </Pressable>

        <View className="mx-1 h-10 flex-1 flex-row items-center rounded-full bg-surface px-3">
          <Globe size={15} color={wardroColors.text.secondary} />
          <TextInput
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={() => go(address)}
            placeholder="Paste a link or a store address"
            placeholderTextColor={wardroColors.text.disabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
            className="ml-2 h-10 flex-1 text-[13px] text-ink"
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reload page"
          hitSlop={8}
          onPress={() => webRef.current?.reload()}
          disabled={!currentUrl}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
        >
          <RotateCw
            size={18}
            color={
              currentUrl
                ? wardroColors.text.primary
                : wardroColors.text.disabled
            }
          />
        </Pressable>
      </View>

      <View className="h-px bg-line" />

      {error ? (
        <View className="border-b border-line bg-danger/5 px-5 py-2.5">
          <Text className="text-[12px] leading-4 text-danger">{error}</Text>
        </View>
      ) : null}

      {currentUrl && Platform.OS !== "web" ? (
        <View ref={captureViewRef} collapsable={false} className="flex-1">
          <WebView
            ref={webRef}
            source={{ uri: currentUrl }}
            onNavigationStateChange={(nav: WebViewNavigation) => {
              setAddress(nav.url);
              setCanGoBack(nav.canGoBack);
            }}
            onError={() => setError("That page could not be loaded.")}
            startInLoadingState
            renderLoading={() => (
              <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator color={wardroColors.primaryDark} />
              </View>
            )}
            allowsBackForwardNavigationGestures
            setSupportMultipleWindows={false}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface">
            <Globe size={26} color={wardroColors.primaryDark} />
          </View>
          <Text className="mt-4 text-center text-[16px] font-bold text-ink">
            Browse a store
          </Text>
          <Text className="mt-1 text-center text-[12.5px] leading-5 text-ink-secondary">
            Paste a product link above, or start with a store.
          </Text>

          <View className="mt-5 flex-row flex-wrap justify-center gap-2">
            {STORES.map((store) => (
              <Pressable
                key={store.label}
                accessibilityRole="button"
                onPress={() => {
                  setAddress(store.url);
                  setCurrentUrl(store.url);
                  setError(null);
                }}
                className="rounded-full border border-line bg-white px-3.5 py-2 active:opacity-80"
              >
                <Text className="text-[12px] font-semibold text-ink">
                  {store.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {Platform.OS === "web" ? (
            <Text className="mt-6 text-center text-[11.5px] leading-4 text-ink-secondary">
              The live page isn't shown on web, but Add this page still works.
            </Text>
          ) : null}
        </View>
      )}

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add this page"
            onPress={() => void addThisPage()}
            disabled={busy || !canSubmit}
            className={`h-12 flex-1 flex-row items-center justify-center rounded-full ${
              busy || !canSubmit
                ? "bg-wardro-primary-dark/40"
                : "bg-wardro-primary-dark active:opacity-80"
            }`}
          >
            {drafting === "page" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[14px] font-bold text-white">
                Add this page
              </Text>
            )}
          </Pressable>

          {Platform.OS !== "web" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Capture this screen"
              onPress={() => void capturePage()}
              disabled={busy || !currentUrl}
              className={`h-12 flex-1 flex-row items-center justify-center rounded-full border ${
                busy || !currentUrl
                  ? "border-line bg-white"
                  : "border-wardro-primary-dark bg-white active:opacity-80"
              }`}
            >
              {drafting === "capture" ? (
                <ActivityIndicator color={wardroColors.primaryDark} />
              ) : (
                <Text
                  className={`text-[14px] font-bold ${
                    busy || !currentUrl
                      ? "text-ink-muted"
                      : "text-wardro-primary-dark"
                  }`}
                >
                  Capture
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
