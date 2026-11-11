import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  History,
  RotateCw,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";

import { api, ApiException } from "~/lib/api";
import {
  reviewKey,
  setPendingReview,
  type PendingReviewItem,
} from "~/lib/pending-review";
import { useProfiles } from "~/lib/profiles-context";
import {
  clearRecentUrls,
  getRecentUrls,
  MAX_RECENT,
  recordRecentUrl,
  type RecentUrl,
} from "~/lib/recent-urls";
import { wardroColors } from "~/src/theme/colors";

const STORES = [
  { label: "H&M", url: "https://www2.hm.com/en_in/index.html" },
  { label: "Zara", url: "https://www.zara.com/in/" },
  { label: "Myntra", url: "https://www.myntra.com/" },
  { label: "Amazon", url: "https://www.amazon.in/" },
];

const ALLOWED_NAVIGATION = /^(https?:|about:blank|blob:|data:)/i;

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (parsed.username || parsed.password) return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function openExternally(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // Schemes the device cannot handle are simply ignored.
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface RecentLinksProps {
  items: RecentUrl[];
  onOpen: (url: string) => void;
  onClear: () => void;
}

function RecentLinks({ items, onOpen, onClear }: RecentLinksProps) {
  if (items.length === 0) return null;

  return (
    <View className="mt-7 w-full">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-secondary">
          Recently visited
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear recently visited links"
          hitSlop={8}
          onPress={onClear}
          className="py-1 active:opacity-60"
        >
          <Text className="text-[11px] font-semibold text-ink-secondary">
            Clear
          </Text>
        </Pressable>
      </View>

      {items.slice(0, 5).map((entry) => (
        <Pressable
          key={entry.url}
          accessibilityRole="button"
          accessibilityLabel={`Open ${entry.title ?? entry.url}`}
          onPress={() => onOpen(entry.url)}
          className="mt-2 flex-row items-center rounded-[14px] border border-line bg-white px-3.5 py-2.5 active:opacity-80"
        >
          <History size={16} color={wardroColors.primaryDark} />
          <View className="ml-2.5 flex-1">
            <Text
              numberOfLines={1}
              className="text-[12.5px] font-semibold text-ink"
            >
              {entry.title || hostOf(entry.url)}
            </Text>
            <Text
              numberOfLines={1}
              className="mt-0.5 text-[10.5px] text-ink-secondary"
            >
              {hostOf(entry.url)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * In-app browser for adding an item from a store page. "Auto Scan" sends
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
  const [canGoForward, setCanGoForward] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drafting, setDrafting] = useState<"scan" | "capture" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { activeProfile } = useProfiles();
  const profileId = activeProfile?.id ?? null;
  const [recent, setRecent] = useState<RecentUrl[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getRecentUrls(profileId).then((rows) => {
      if (!cancelled) setRecent(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const remember = (url: string, title: string | null) => {
    if (!url.startsWith("http")) return;
    setRecent((current) =>
      [
        { url, title: title?.trim() || null, visitedAt: Date.now() },
        ...current.filter((entry) => entry.url !== url),
      ].slice(0, MAX_RECENT),
    );
    void recordRecentUrl(profileId, url, title);
  };

  const clearHistory = () => {
    setRecent([]);
    void clearRecentUrls(profileId);
  };

  const openRecent = (url: string) => {
    setError(null);
    setAddress(url);
    setCurrentUrl(url);
  };

  const reviewParams = params.wardrobeId
    ? { wardrobeId: params.wardrobeId }
    : {};

  const openReview = (rows: PendingReviewItem[]) => {
    setPendingReview(rows);
    router.replace({
      pathname: "/(root)/review",
      params: reviewParams,
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
      setError("Enter a web address, for example hm.com.");
      return;
    }
    Keyboard.dismiss();
    setEditingAddress(false);
    setError(null);
    setAddress(next);
    if (next === currentUrl) {
      webRef.current?.reload();
    } else {
      setCurrentUrl(next);
    }
  };

  const autoScanPage = async () => {
    const url = normalizeUrl(address) ?? currentUrl;
    if (!url) {
      setError("Open a product page first.");
      return;
    }

    Keyboard.dismiss();
    setDrafting("scan");
    setError(null);
    try {
      const draft = await api.draftItem({ url });
      openReview([
        {
          key: reviewKey("scan", 0),
          photo: null,
          photoPath: draft.photoPath,
          photoUri: draft.photoUri,
          draft,
          sourceUrl: url,
        },
      ]);
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
      setError("Capture needs the phone app. Use Auto Scan here.");
      return;
    }
    if (!currentUrl) {
      setError("Open a product page first.");
      return;
    }

    setDrafting("capture");
    setError(null);
    Keyboard.dismiss();
    try {
      const { captureRef } = await import("react-native-view-shot");
      const imageBase64 = await captureRef(captureViewRef, {
        format: "jpg",
        quality: 0.85,
        result: "base64",
        handleGLSurfaceViewOnAndroid: true,
      });
      if (!imageBase64) {
        throw new Error("The screen could not be captured.");
      }

      // Hand the screenshot to the shared review list. The review drafts it
      // and uploads the photo when the user adds it to the closet.
      openReview([
        {
          key: reviewKey("capture", 0),
          photo: {
            uri: `data:image/jpeg;base64,${imageBase64}`,
            base64: imageBase64,
            mimeType: "image/jpeg",
            fileName: null,
          },
          photoPath: null,
          photoUri: null,
          draft: null,
          sourceUrl: currentUrl,
        },
      ]);
    } catch (draftError) {
      setError(
        draftError instanceof Error
          ? draftError.message
          : "Could not capture that screen.",
      );
    } finally {
      setDrafting(null);
    }
  };

  const shouldStartLoad = (request: { url: string }) => {
    const { url } = request;
    if (/^javascript:/i.test(url)) return false;
    if (
      /^https?:/i.test(url) &&
      /\.(pdf|zip|rar|apk|dmg|exe)(\?|#|$)/i.test(url)
    ) {
      void openExternally(url);
      return false;
    }
    if (ALLOWED_NAVIGATION.test(url)) return true;
    void openExternally(url);
    return false;
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
  const actionsBlocked = busy || loading;
  const canSubmit = Boolean(normalizeUrl(address) ?? currentUrl);
  const showBrowserControls = currentUrl !== null && Platform.OS !== "web";

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

        {showBrowserControls ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back a page"
              hitSlop={6}
              disabled={!canGoBack}
              onPress={() => webRef.current?.goBack()}
              className="h-11 w-8 items-center justify-center active:opacity-60"
            >
              <ChevronLeft
                size={20}
                color={
                  canGoBack
                    ? wardroColors.text.primary
                    : wardroColors.text.disabled
                }
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go forward a page"
              hitSlop={6}
              disabled={!canGoForward}
              onPress={() => webRef.current?.goForward()}
              className="h-11 w-8 items-center justify-center active:opacity-60"
            >
              <ChevronRight
                size={20}
                color={
                  canGoForward
                    ? wardroColors.text.primary
                    : wardroColors.text.disabled
                }
              />
            </Pressable>
          </>
        ) : null}

        <View className="mx-1 h-10 flex-1 flex-row items-center rounded-full bg-surface px-3">
          <Globe size={15} color={wardroColors.text.secondary} />
          <TextInput
            value={address}
            onChangeText={setAddress}
            onSubmitEditing={() => go(address)}
            onFocus={() => setEditingAddress(true)}
            onBlur={() => setEditingAddress(false)}
            placeholder="Paste a link or a store address"
            placeholderTextColor={wardroColors.text.disabled}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
            className="ml-2 h-10 flex-1 text-[13px] text-ink"
          />
          {address.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear the address"
              hitSlop={8}
              onPress={() => setAddress("")}
              className="ml-1 h-7 w-7 items-center justify-center rounded-full active:bg-line"
            >
              <X size={14} color={wardroColors.text.secondary} />
            </Pressable>
          ) : null}
        </View>

        {showBrowserControls ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reload page"
            hitSlop={8}
            onPress={() => webRef.current?.reload()}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-surface"
          >
            <RotateCw size={18} color={wardroColors.text.primary} />
          </Pressable>
        ) : null}
      </View>

      <View className="h-px bg-line" />

      {loading ? (
        <View className="h-0.5 bg-line">
          <View
            className="h-0.5 bg-wardro-primary-dark"
            style={{ width: `${Math.max(progress, 0.04) * 100}%` }}
          />
        </View>
      ) : null}

      {error ? (
        <View className="flex-row items-center border-b border-line bg-danger/5 px-5 py-2.5">
          <Text className="flex-1 text-[12px] leading-4 text-danger">
            {error}
          </Text>
          {showBrowserControls ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading the page"
              hitSlop={8}
              onPress={() => {
                setError(null);
                webRef.current?.reload();
              }}
              className="ml-3 rounded-full border border-danger/30 px-3 py-1 active:opacity-70"
            >
              <Text className="text-[11px] font-bold text-danger">Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {currentUrl && Platform.OS !== "web" ? (
        <View ref={captureViewRef} collapsable={false} className="flex-1">
          <WebView
            ref={webRef}
            source={{ uri: currentUrl }}
            onNavigationStateChange={(nav: WebViewNavigation) => {
              if (!editingAddress) setAddress(nav.url);
              setCanGoBack(nav.canGoBack);
              setCanGoForward(nav.canGoForward);
              if (!nav.loading) remember(nav.url, nav.title);
            }}
            onShouldStartLoadWithRequest={shouldStartLoad}
            onOpenWindow={({ nativeEvent }) => {
              if (ALLOWED_NAVIGATION.test(nativeEvent.targetUrl)) {
                go(nativeEvent.targetUrl);
              } else {
                void openExternally(nativeEvent.targetUrl);
              }
            }}
            onLoadStart={() => {
              setLoading(true);
              setProgress(0);
              setError(null);
              Keyboard.dismiss();
            }}
            onLoadProgress={({ nativeEvent }) =>
              setProgress(nativeEvent.progress)
            }
            onLoadEnd={() => {
              setLoading(false);
              setProgress(1);
            }}
            onError={({ nativeEvent }) =>
              setError(
                nativeEvent.description || "That page could not be loaded.",
              )
            }
            onRenderProcessGone={() =>
              setError("The page stopped responding. Tap Retry.")
            }
            onContentProcessDidTerminate={() => webRef.current?.reload()}
            startInLoadingState
            renderLoading={() => (
              <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator color={wardroColors.primaryDark} />
              </View>
            )}
            allowsBackForwardNavigationGestures
            setSupportMultipleWindows={false}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            domStorageEnabled
            cacheEnabled
            // WebView's default hardware layer can come back blank in
            // react-native-view-shot; software rendering keeps Capture intact.
            androidLayerType="software"
            style={{ flex: 1 }}
          />
        </View>
      ) : currentUrl ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-surface">
            <Globe size={26} color={wardroColors.primaryDark} />
          </View>
          <Text className="mt-4 text-center text-[16px] font-bold text-ink">
            Preview runs on the phone
          </Text>
          <Text className="mt-1 text-center text-[12.5px] leading-5 text-ink-secondary">
            The in-app browser isn't available in the web build. Use Auto Scan
            to import the link, or open it in a browser tab.
          </Text>
          <Text
            numberOfLines={2}
            className="mt-4 px-4 text-center text-[11.5px] leading-4 text-ink-secondary"
          >
            {currentUrl}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open the page in a browser tab"
            onPress={() => void openExternally(currentUrl)}
            className="mt-5 rounded-full border border-line bg-white px-4 py-2 active:opacity-80"
          >
            <Text className="text-[12px] font-semibold text-ink">
              Open in browser
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCurrentUrl(null);
              setAddress("");
              setError(null);
            }}
            className="mt-3 px-3 py-2 active:opacity-60"
          >
            <Text className="text-[12px] font-semibold text-ink-secondary">
              Use a different link
            </Text>
          </Pressable>

          <RecentLinks
            items={recent}
            onOpen={openRecent}
            onClear={clearHistory}
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
                  Keyboard.dismiss();
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
              Live preview needs the phone app; Auto Scan works here.
            </Text>
          ) : null}

          <RecentLinks
            items={recent}
            onOpen={openRecent}
            onClear={clearHistory}
          />
        </View>
      )}

      <View className="border-t border-line bg-white px-4 pb-2 pt-3">
        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Auto Scan this page"
            onPress={() => void autoScanPage()}
            disabled={actionsBlocked || !canSubmit}
            className={`h-12 flex-1 flex-row items-center justify-center rounded-full ${
              actionsBlocked || !canSubmit
                ? "bg-wardro-primary-dark/40"
                : "bg-wardro-primary-dark active:opacity-80"
            }`}
          >
            {drafting === "scan" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[14px] font-bold text-white">
                Auto Scan
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture this screen"
            onPress={() => void capturePage()}
            disabled={actionsBlocked || !currentUrl}
            className={`h-12 flex-1 flex-row items-center justify-center rounded-full border ${
              actionsBlocked || !currentUrl
                ? "border-line bg-white"
                : "border-wardro-primary-dark bg-white active:opacity-80"
            }`}
          >
            {drafting === "capture" ? (
              <ActivityIndicator color={wardroColors.primaryDark} />
            ) : (
              <Text
                className={`text-[14px] font-bold ${
                  actionsBlocked || !currentUrl
                    ? "text-ink-muted"
                    : "text-wardro-primary-dark"
                }`}
              >
                Capture
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
