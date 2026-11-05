import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import type {
  ScrollViewInstance,
  TextInputKeyPressEvent,
} from "react-native";

import {
  fetchApiHealth,
  fetchOllamaHealth,
  sendChat,
} from "./src/api";
import {
  DEFAULT_API_URL,
  DEFAULT_HOUSEHOLD_ID,
  DEFAULT_PROFILE_ID,
  DEFAULT_USER_ID,
  normalizeApiBaseUrl,
} from "./src/config";
import type {
  ApiHealth,
  ChatMessage,
  ChatResponse,
  OllamaHealth,
} from "./src/types";

const colors = {
  background: "#F4EFE7",
  surface: "#FFFDF9",
  surfaceMuted: "#EEE7DB",
  field: "#F8F4ED",
  ink: "#221F1B",
  inkSoft: "#3D3831",
  muted: "#756D63",
  faint: "#A79D90",
  border: "#E2D9CC",
  borderStrong: "#D2C6B6",
  accent: "#A64B2A",
  accentSoft: "#F5E2D7",
  userBubble: "#2A2621",
  userText: "#FFF9F1",
  success: "#2F7D5B",
  warning: "#B7791F",
  danger: "#B23A2F",
  dangerSoft: "#FCEBE7",
  dangerBorder: "#F0C9C0",
  white: "#FFFFFF",
};

const QUICK_PROMPTS = [
  "Show me all my dresses",
  "I have a black-tie event next month",
  "How can I organize my wardrobe?",
  "Can you identify this clothing item in my photo?",
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Hi — I’m the Wardro AI test console. Ask me about outfits, wardrobe organization, or what the agents can do.\n\nWardrobe inventory, photo analysis, and conversation memory are not connected yet, so I’ll say when I can’t see something rather than inventing it.",
};

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [threadId, setThreadId] = useState(makeThreadId);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [householdId, setHouseholdId] = useState(DEFAULT_HOUSEHOLD_ID);
  const [profileId, setProfileId] = useState(DEFAULT_PROFILE_ID);
  const [showSettings, setShowSettings] = useState(false);

  const [apiHealth, setApiHealth] = useState<ApiHealth | null>(null);
  const [ollamaHealth, setOllamaHealth] = useState<OllamaHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [healthNonce, setHealthNonce] = useState(0);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const scrollRef = useRef<ScrollViewInstance>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const conversationRef = useRef(0);

  const hasUserMessages = messages.some((message) => message.role === "user");
  const status = getServiceStatus(isCheckingHealth, apiHealth, ollamaHealth);
  const canSend = draft.trim().length > 0 && !isSending;

  useEffect(() => {
    let cancelled = false;
    setIsCheckingHealth(true);
    setHealthError(null);
    setApiHealth(null);
    setOllamaHealth(null);

    const timer = setTimeout(async () => {
      const base = normalizeApiBaseUrl(apiBaseUrl);
      try {
        const health = await fetchApiHealth(base);
        if (cancelled) return;
        setApiHealth(health);
      } catch (error) {
        if (cancelled) return;
        setHealthError(
          error instanceof Error
            ? error.message
            : "The API could not be reached.",
        );
        setIsCheckingHealth(false);
        return;
      }

      try {
        const ollama = await fetchOllamaHealth(base);
        if (cancelled) return;
        setOllamaHealth(ollama);
      } catch {
        if (cancelled) return;
        setOllamaHealth(null);
      } finally {
        if (!cancelled) setIsCheckingHealth(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [apiBaseUrl, healthNonce]);

  useEffect(() => {
    if (!isSending) {
      setElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
  }, [isSending]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const refreshHealth = () => setHealthNonce((value) => value + 1);

  async function submitMessage(
    text: string,
    options: { appendUser?: boolean } = {},
  ) {
    const message = text.trim();
    if (!message || sendingRef.current) return;

    if (options.appendUser !== false) {
      setMessages((current) => [
        ...current.filter((item) => !item.retryable),
        { id: makeId(), role: "user", text: message },
      ]);
    }
    setDraft("");
    setLastFailedMessage(null);
    setElapsedMs(0);
    sendingRef.current = true;
    setIsSending(true);

    const generation = conversationRef.current;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await sendChat({
        apiBaseUrl,
        message,
        threadId,
        userId,
        householdId,
        profileId,
        signal: controller.signal,
      });
      if (conversationRef.current !== generation) return;
      setThreadId(response.thread_id);
      setMessages((current) => [...current, toAssistantMessage(response)]);
    } catch (error) {
      if (conversationRef.current !== generation) return;
      if (isAbortError(error)) {
        setMessages((current) => [
          ...current,
          {
            id: makeId(),
            role: "system",
            variant: "muted",
            text: "Request stopped.",
          },
        ]);
      } else {
        setLastFailedMessage(message);
        setMessages((current) => [
          ...current,
          {
            id: makeId(),
            role: "system",
            variant: "error",
            text:
              error instanceof Error
                ? error.message
                : "Something went wrong while contacting the agent.",
            retryable: true,
          },
        ]);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (conversationRef.current === generation) {
        sendingRef.current = false;
        setIsSending(false);
      }
    }
  }

  function handleSend() {
    void submitMessage(draft);
  }

  function handleRetry() {
    if (!lastFailedMessage || sendingRef.current) return;
    setMessages((current) => current.filter((message) => !message.retryable));
    void submitMessage(lastFailedMessage, { appendUser: false });
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleNewChat() {
    conversationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    sendingRef.current = false;
    setIsSending(false);
    setElapsedMs(0);
    setMessages([INITIAL_MESSAGE]);
    setDraft("");
    setThreadId(makeThreadId());
    setLastFailedMessage(null);
  }

  function handleComposerKeyPress(event: TextInputKeyPressEvent) {
    if (Platform.OS !== "web" || isSending) return;
    const nativeEvent = event.nativeEvent as typeof event.nativeEvent & {
      shiftKey?: boolean;
    };
    if (nativeEvent.key === "Enter" && !nativeEvent.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function resetDefaults() {
    setApiBaseUrl(DEFAULT_API_URL);
    setUserId(DEFAULT_USER_ID);
    setHouseholdId(DEFAULT_HOUSEHOLD_ID);
    setProfileId(DEFAULT_PROFILE_ID);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.page}>
          <View style={[styles.shell, isWide && styles.shellWide]}>
            <View style={[styles.header, !isWide && styles.headerStacked]}>
              <View style={styles.brandRow}>
                <View style={styles.logoMark}>
                  <Text style={styles.logoText}>W</Text>
                </View>
                <View>
                  <Text style={styles.wordmark}>
                    WARDRO <Text style={styles.aiMark}>AI</Text>
                  </Text>
                  <Text style={styles.tagline}>local-first styling console</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  accessibilityLabel="Service status. Press to refresh."
                  accessibilityRole="button"
                  onPress={refreshHealth}
                  style={styles.statusPill}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: status.color }]}
                  />
                  <Text style={styles.statusText}>{status.label}</Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Toggle development context"
                  accessibilityRole="button"
                  onPress={() => setShowSettings((value) => !value)}
                  style={styles.ghostButton}
                >
                  <Text style={styles.ghostButtonText}>
                    {showSettings ? "Hide setup" : "Dev context"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel="Start a new chat"
                  accessibilityRole="button"
                  onPress={handleNewChat}
                  style={styles.primarySmallButton}
                >
                  <Text style={styles.primarySmallButtonText}>New chat</Text>
                </Pressable>
              </View>
            </View>

            {showSettings ? (
              <View style={styles.settingsPanel}>
                <View style={styles.settingsTopRow}>
                  <View style={styles.flex}>
                    <Text style={styles.settingsTitle}>Development context</Text>
                    <Text style={styles.settingsSubtitle}>
                      These IDs are sent in the request body and trusted only when
                      the backend runs with APP_ENV=development. Production must use
                      verified authentication.
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isCheckingHealth}
                    onPress={refreshHealth}
                    style={styles.linkButton}
                  >
                    <Text style={styles.linkText}>
                      {isCheckingHealth ? "Checking…" : "Refresh health"}
                    </Text>
                  </Pressable>
                </View>

                <View style={[styles.fieldsRow, !isWide && styles.fieldsColumn]}>
                  <Field
                    label="API base URL"
                    value={apiBaseUrl}
                    onChangeText={setApiBaseUrl}
                    onBlur={() =>
                      setApiBaseUrl((current) => normalizeApiBaseUrl(current))
                    }
                    placeholder="http://localhost:8000"
                    hint="Android emulator: http://10.0.2.2:8000"
                  />
                  <Field
                    label="User ID"
                    value={userId}
                    onChangeText={setUserId}
                    placeholder="dev-user"
                  />
                </View>

                <View style={[styles.fieldsRow, !isWide && styles.fieldsColumn]}>
                  <Field
                    label="Household ID"
                    value={householdId}
                    onChangeText={setHouseholdId}
                    placeholder="dev-family"
                  />
                  <Field
                    label="Profile ID"
                    value={profileId}
                    onChangeText={setProfileId}
                    placeholder="dev-profile"
                  />
                </View>

                <View style={styles.runtimeRow}>
                  <Text style={styles.runtimeText}>
                    Thread:{" "}
                    <Text selectable style={[styles.runtimeValue, styles.mono]}>
                      {threadId}
                    </Text>
                  </Text>
                  {apiHealth ? (
                    <Text style={styles.runtimeText}>
                      API v{apiHealth.version} · {apiHealth.environment}
                    </Text>
                  ) : null}
                  {ollamaHealth ? (
                    <Text style={styles.runtimeText}>
                      Chat: {ollamaHealth.chat_model} · Vision:{" "}
                      {ollamaHealth.vision_model}
                    </Text>
                  ) : null}
                  {ollamaHealth?.detail ? (
                    <Text style={styles.runtimeWarning}>{ollamaHealth.detail}</Text>
                  ) : null}
                  {healthError ? (
                    <Text style={styles.runtimeWarning}>{healthError}</Text>
                  ) : null}
                </View>

                <View style={styles.settingsActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={resetDefaults}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Reset defaults</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowSettings(false)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {healthError ? (
              <View style={styles.offlineBanner}>
                <View style={styles.flex}>
                  <Text style={styles.offlineTitle}>Backend not reachable</Text>
                  <Text style={styles.offlineText}>
                    {healthError} Start the API on port 8000 and make sure this
                    page’s origin is allowed by CORS_ORIGINS.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={refreshHealth}
                  style={styles.offlineButton}
                >
                  <Text style={styles.offlineButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            <ScrollView
              ref={scrollRef}
              style={styles.messageScroll}
              contentContainerStyle={styles.messageList}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  canRetry={!isSending && Boolean(lastFailedMessage)}
                  onRetry={handleRetry}
                />
              ))}

              {isSending ? <TypingBubble elapsedMs={elapsedMs} /> : null}

              {!hasUserMessages ? (
                <QuickPrompts
                  disabled={isSending}
                  onSelect={(prompt) => void submitMessage(prompt)}
                />
              ) : null}
            </ScrollView>

            <View style={styles.composerArea}>
              {isSending ? (
                <Text style={styles.sendingHint}>
                  The local model may take several seconds to answer.
                </Text>
              ) : null}
              <View style={styles.composer}>
                <TextInput
                  accessibilityLabel="Message"
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  onKeyPress={handleComposerKeyPress}
                  placeholder="Ask about an outfit, a garment, or your wardrobe…"
                  placeholderTextColor={colors.faint}
                  multiline
                  editable={!isSending}
                  textAlignVertical="top"
                  maxLength={8000}
                />
                {isSending ? (
                  <Pressable
                    accessibilityLabel="Stop the request"
                    accessibilityRole="button"
                    onPress={handleStop}
                    style={styles.stopButton}
                  >
                    <Text style={styles.stopText}>Stop</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityLabel="Send message"
                    accessibilityRole="button"
                    disabled={!canSend}
                    onPress={handleSend}
                    style={[
                      styles.sendButton,
                      !canSend && styles.sendButtonDisabled,
                    ]}
                  >
                    <Text style={styles.sendText}>Send</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.composerHint}>
                {Platform.OS === "web"
                  ? "Enter to send · Shift+Enter for a new line · "
                  : ""}
                Dev console · single-turn · wardrobe data unavailable
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  canRetry,
  onRetry,
}: {
  message: ChatMessage;
  canRetry: boolean;
  onRetry: () => void;
}) {
  if (message.role === "system") {
    if (message.variant === "error") {
      return (
        <View style={styles.errorCard}>
          <Text style={styles.errorLabel}>Request failed</Text>
          <Text style={styles.errorText}>{message.text}</Text>
          {message.retryable && canRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  const isUser = message.role === "user";
  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.assistantRow,
      ]}
    >
      {!isUser ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>W</Text>
        </View>
      ) : null}
      <View style={styles.messageColumn}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <RichText text={message.text} tone={isUser ? "user" : "assistant"} />
        </View>
        {message.meta ? (
          <View style={styles.metaRow}>
            {message.meta.intent ? (
              <MetaChip label={formatLabel(message.meta.intent)} />
            ) : null}
            {message.meta.agent ? (
              <MetaChip label={formatLabel(message.meta.agent)} />
            ) : null}
            {message.meta.model ? (
              <MetaChip label={message.meta.model} />
            ) : null}
            {message.meta.persistence === "disabled" ? (
              <MetaChip label="single-turn" />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RichText({
  text,
  tone,
}: {
  text: string;
  tone: "assistant" | "user";
}) {
  const lines = text.split(/\r?\n/);
  const baseStyle = tone === "user" ? styles.userText : styles.assistantText;

  return (
    <View style={styles.richText}>
      {lines.map((line, index) => {
        if (!line.trim()) {
          return <View key={`blank-${index}`} style={styles.blankLine} />;
        }

        const heading = line.match(/^\s*#{1,3}\s+(.*)$/);
        if (heading) {
          return (
            <Text key={index} style={[baseStyle, styles.richHeading]}>
              <InlineMarkdown text={heading[1]} />
            </Text>
          );
        }

        const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
        if (bullet) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={[baseStyle, styles.bulletDot]}>•</Text>
              <Text style={[baseStyle, styles.bulletText]}>
                <InlineMarkdown text={bullet[1]} />
              </Text>
            </View>
          );
        }

        const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={[baseStyle, styles.numberMarker]}>{numbered[1]}.</Text>
              <Text style={[baseStyle, styles.bulletText]}>
                <InlineMarkdown text={numbered[2]} />
              </Text>
            </View>
          );
        }

        return (
          <Text key={index} style={baseStyle}>
            <InlineMarkdown text={line} />
          </Text>
        );
      })}
    </View>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: ReactNode[] = parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <Text key={index} style={styles.strong}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });
  return <>{nodes}</>;
}

function MetaChip({ label }: { label: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function QuickPrompts({
  disabled,
  onSelect,
}: {
  disabled: boolean;
  onSelect: (prompt: string) => void;
}) {
  return (
    <View style={styles.promptsBlock}>
      <Text style={styles.promptsLabel}>Try a request</Text>
      <View style={styles.promptsRow}>
        {QUICK_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => onSelect(prompt)}
            style={({ pressed }) => [
              styles.promptChip,
              pressed && styles.promptChipPressed,
              disabled && styles.disabled,
            ]}
          >
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TypingBubble({ elapsedMs }: { elapsedMs: number }) {
  return (
    <View style={[styles.messageRow, styles.assistantRow]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>W</Text>
      </View>
      <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.typingText}>
          Thinking{elapsedMs > 0 ? ` · ${(elapsedMs / 1000).toFixed(1)}s` : "…"}
        </Text>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  onBlur?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function getServiceStatus(
  checking: boolean,
  api: ApiHealth | null,
  ollama: OllamaHealth | null,
): { label: string; color: string } {
  if (checking) {
    return { label: "Checking services…", color: colors.faint };
  }
  if (!api) {
    return { label: "API offline", color: colors.danger };
  }
  if (!ollama) {
    return { label: "API online · Ollama unknown", color: colors.warning };
  }
  if (!ollama.reachable) {
    return { label: "API online · Ollama offline", color: colors.danger };
  }
  if (ollama.status === "degraded") {
    return { label: "API online · Ollama degraded", color: colors.warning };
  }
  return { label: "API online · Ollama ready", color: colors.success };
}

function toAssistantMessage(response: ChatResponse): ChatMessage {
  const metadata = response.metadata ?? {};
  return {
    id: makeId(),
    role: "assistant",
    text: response.message || "The agent returned an empty response.",
    meta: {
      intent: response.intent,
      agent: response.agent,
      model: typeof metadata.model === "string" ? metadata.model : undefined,
      threadId: response.thread_id,
      persistence:
        typeof metadata.persistence === "string"
          ? metadata.persistence
          : undefined,
    },
  };
}

function makeThreadId(): string {
  return `thread-${makeId()}`;
}

function makeId(): string {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (webCrypto?.randomUUID) {
    return webCrypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shell: {
    flex: 1,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    backgroundColor: colors.background,
  },
  shellWide: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerStacked: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.userText,
    fontSize: 18,
    fontWeight: "800",
  },
  wordmark: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: colors.ink,
  },
  aiMark: {
    color: colors.accent,
  },
  tagline: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.field,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: colors.inkSoft,
    fontWeight: "600",
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  ghostButtonText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: "600",
  },
  primarySmallButton: {
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: colors.ink,
  },
  primarySmallButtonText: {
    fontSize: 12,
    color: colors.userText,
    fontWeight: "600",
  },
  settingsPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  settingsTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    justifyContent: "space-between",
  },
  settingsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  settingsSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
    marginTop: 2,
    maxWidth: 580,
  },
  linkButton: {
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 11.5,
    color: colors.accent,
    fontWeight: "700",
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldsColumn: {
    flexDirection: "column",
  },
  field: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  fieldInput: {
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: colors.ink,
  },
  fieldHint: {
    fontSize: 10,
    color: colors.faint,
    lineHeight: 14,
  },
  runtimeRow: {
    gap: 3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 9,
  },
  runtimeText: {
    fontSize: 10.5,
    color: colors.muted,
  },
  runtimeValue: {
    color: colors.inkSoft,
  },
  runtimeWarning: {
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.warning,
  },
  mono: {
    fontFamily: monoFont,
  },
  settingsActions: {
    flexDirection: "row",
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.field,
  },
  secondaryButtonText: {
    fontSize: 11.5,
    color: colors.inkSoft,
    fontWeight: "600",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.dangerSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.dangerBorder,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  offlineTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.danger,
  },
  offlineText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
    marginTop: 1,
  },
  offlineButton: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  offlineButtonText: {
    color: colors.white,
    fontSize: 11.5,
    fontWeight: "700",
  },
  messageScroll: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
    gap: 16,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  userRow: {
    justifyContent: "flex-end",
    paddingLeft: 40,
  },
  assistantRow: {
    justifyContent: "flex-start",
    paddingRight: 28,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.accent,
  },
  messageColumn: {
    maxWidth: "84%",
    flexShrink: 1,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderTopRightRadius: 5,
  },
  richText: {
    gap: 3,
  },
  assistantText: {
    color: colors.ink,
    fontSize: 14.5,
    lineHeight: 21.5,
  },
  userText: {
    color: colors.userText,
    fontSize: 14.5,
    lineHeight: 21.5,
  },
  richHeading: {
    fontWeight: "700",
    fontSize: 15,
  },
  strong: {
    fontWeight: "700",
  },
  blankLine: {
    height: 5,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  bulletDot: {
    width: 9,
    textAlign: "center",
  },
  numberMarker: {
    minWidth: 18,
    fontWeight: "600",
  },
  bulletText: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
    paddingLeft: 2,
  },
  metaChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  metaChipText: {
    fontSize: 9.5,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  systemRow: {
    alignItems: "center",
    paddingVertical: 2,
  },
  systemText: {
    fontSize: 11.5,
    color: colors.muted,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    overflow: "hidden",
  },
  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 14,
    padding: 13,
    gap: 6,
  },
  errorLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.danger,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 2,
    backgroundColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    color: colors.white,
    fontSize: 11.5,
    fontWeight: "700",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: "600",
  },
  promptsBlock: {
    marginTop: 4,
    paddingLeft: 39,
    gap: 8,
  },
  promptsLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.faint,
  },
  promptsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  promptChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  promptChipPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  promptText: {
    fontSize: 12,
    color: colors.inkSoft,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.45,
  },
  composerArea: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 12,
  },
  sendingHint: {
    fontSize: 10.5,
    color: colors.muted,
    marginBottom: 7,
    marginLeft: 2,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 11,
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink,
  },
  sendButton: {
    height: 46,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  stopButton: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stopText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  composerHint: {
    fontSize: 10.5,
    color: colors.faint,
    marginTop: 7,
    textAlign: "center",
  },
});
