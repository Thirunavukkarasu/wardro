import { AlertCircle, Send, Sparkles } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AgentException, sendAgentMessage } from "~/lib/agent";
import { useAuth } from "~/lib/auth-context";
import { useProfiles } from "~/lib/profiles-context";
import { wardroColors } from "~/src/theme/colors";

type MessageRole = "user" | "assistant" | "error";

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  intent?: string;
  agent?: string;
}

const SUGGESTIONS = [
  "What should I wear today?",
  "Build a casual lunch outfit",
  "What colours work for a wedding?",
];

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function newThreadId(profileId: number | null): string {
  return `thread-${profileId ?? "guest"}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function welcomeText(profileName: string | null): string {
  if (!profileName) {
    return "Ask me what to wear, how to style something, or what to pack. Sign in and pick a profile to give me wardrobe context.";
  }
  return `Ask me what ${firstName(
    profileName,
  )} should wear, how to style a piece, or what to pack. Wardrobe tools are not connected yet, so my suggestions are illustrative — but this is the real agent workflow.`;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState(() =>
    newThreadId(activeProfile?.id ?? null),
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lastPromptRef = useRef<string | null>(null);

  const profileName = activeProfile?.name ?? null;
  const canSend =
    Boolean(input.trim()) &&
    Boolean(user?.authId) &&
    Boolean(activeProfile) &&
    !sending;

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: welcomeText(profileName),
      },
    ]);
    setThreadId(newThreadId(activeProfile?.id ?? null));
    setError(null);
    setInput("");
    lastPromptRef.current = null;
  }, [activeProfile?.id, profileName]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, sending]);

  const send = useCallback(
    async (raw: string, appendUser = true) => {
      const text = raw.trim();
      if (!text || sending || !user?.authId || !activeProfile) return;

      lastPromptRef.current = text;
      setError(null);
      setInput("");

      if (appendUser) {
        setMessages((current) => [
          ...current,
          {
            id: `user-${Date.now()}`,
            role: "user",
            text,
          },
        ]);
      }

      setSending(true);
      try {
        const reply = await sendAgentMessage({
          message: text,
          threadId,
          userId: user.authId,
          profileId: String(activeProfile.id),
        });

        setThreadId(reply.threadId);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: reply.message,
            intent: reply.intent,
            agent: reply.agent,
          },
        ]);
      } catch (sendError) {
        const message =
          sendError instanceof AgentException
            ? sendError.message
            : "Something went wrong while asking the agent.";
        setError(message);
        setMessages((current) => [
          ...current,
          {
            id: `error-${Date.now()}`,
            role: "error",
            text: message,
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [activeProfile, sending, threadId, user?.authId],
  );

  const retry = useCallback(() => {
    const prompt = lastPromptRef.current;
    if (!prompt) return;
    setMessages((current) =>
      current.filter((message) => message.role !== "error"),
    );
    send(prompt, false);
  }, [send]);

  const showSuggestions = messages.length <= 1 && !sending;

  return (
    <SafeAreaView className="flex-1 bg-wardro-background" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center px-5 pb-3 pt-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-wardro-primary-light">
            <Sparkles size={21} color={wardroColors.primaryDark} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[24px] font-extrabold tracking-tight text-wardro-text-primary">
              Ask Wardro
            </Text>
            <Text className="mt-0.5 text-[12px] font-medium text-wardro-text-secondary">
              {profileName ? `${firstName(profileName)}'s wardrobe` : "Wardrobe assistant"}
            </Text>
          </View>
          {activeProfile ? (
            <View
              className="h-9 min-w-9 items-center justify-center rounded-full px-2"
              style={{ backgroundColor: activeProfile.color }}
            >
              <Text className="text-[12px] font-extrabold text-white">
                {activeProfile.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mx-5 mb-2 rounded-[14px] bg-wardro-primary-light px-3.5 py-2.5">
          <Text className="text-[11.5px] leading-4 text-wardro-primary-dark">
            Local agent · wardrobe tools are not connected yet. Suggestions are illustrative; the
            conversation and profile context are real.
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {sending ? (
            <View className="mb-3 max-w-[88%] self-start rounded-[18px] rounded-bl-[6px] border border-wardro-border bg-wardro-surface px-4 py-3">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color={wardroColors.primaryDark} />
                <Text className="ml-2 text-[13px] font-medium text-wardro-text-secondary">
                  Thinking…
                </Text>
              </View>
            </View>
          ) : null}

          {showSuggestions ? (
            <View className="mt-4">
              <Text className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-wardro-text-disabled">
                Try asking
              </Text>
              {SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => send(suggestion)}
                  className="mb-2 self-start rounded-full border border-wardro-border bg-wardro-surface px-4 py-2.5 active:opacity-70"
                >
                  <Text className="text-[12.5px] font-semibold text-wardro-text-primary">
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {error ? (
          <View className="mx-5 mb-2 flex-row items-start rounded-[14px] border border-wardro-danger/20 bg-wardro-danger/10 px-3 py-2.5">
            <AlertCircle size={16} color={wardroColors.danger} />
            <Text className="ml-2 flex-1 text-[11.5px] leading-4 text-wardro-danger">
              {error}
            </Text>
            <Pressable onPress={retry} className="ml-2 active:opacity-60">
              <Text className="text-[11.5px] font-bold text-wardro-danger">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="border-t border-wardro-border bg-wardro-surface px-4 pb-3 pt-3">
          <View className="flex-row items-end rounded-[22px] border border-wardro-border bg-wardro-surface-secondary px-3 py-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={8000}
              placeholder={
                profileName
                  ? `Ask about ${firstName(profileName)}'s wardrobe…`
                  : "Ask about your wardrobe…"
              }
              placeholderTextColor={wardroColors.text.disabled}
              className="max-h-28 flex-1 px-1 py-2 text-[14px] font-medium text-wardro-text-primary outline-none"
              style={{ textAlignVertical: "top" }}
              editable={!sending}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!canSend}
              onPress={() => send(input)}
              className={`mb-0.5 ml-2 h-9 w-9 items-center justify-center rounded-full ${
                canSend ? "bg-wardro-primary-dark active:opacity-75" : "bg-wardro-border"
              }`}
            >
              <Send size={17} color={wardroColors.surface} />
            </Pressable>
          </View>
          <Text className="mt-2 text-center text-[10px] text-wardro-text-disabled">
            {activeProfile ? `Context: ${activeProfile.name}` : "No active profile"}
            {"  ·  "}
            AI can be wrong. Check important details.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <View className="mb-3 max-w-[88%] self-end rounded-[18px] rounded-br-[6px] bg-wardro-primary-dark px-4 py-3">
        <Text className="text-[14px] leading-5 text-white">{message.text}</Text>
      </View>
    );
  }

  if (message.role === "error") {
    return (
      <View className="mb-3 max-w-[88%] self-start rounded-[18px] rounded-bl-[6px] border border-wardro-danger/20 bg-wardro-danger/10 px-4 py-3">
        <Text className="text-[13px] leading-5 text-wardro-danger">{message.text}</Text>
      </View>
    );
  }

  return (
    <View className="mb-3 max-w-[88%] self-start rounded-[18px] rounded-bl-[6px] border border-wardro-border bg-wardro-surface px-4 py-3">
      <MarkdownText text={message.text} />
      {message.intent || message.agent ? (
        <Text className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.5px] text-wardro-text-disabled">
          {[message.intent, message.agent].filter(Boolean).join(" · ")}
        </Text>
      ) : null}
    </View>
  );
}

/** Minimal Markdown for agent replies: bold spans, headings and line breaks. */
function MarkdownText({ text }: { text: string }) {
  return (
    <Text className="text-[14px] leading-5 text-wardro-text-primary">
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={index} className="font-bold">
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/^(\s*)[*-]\s+/gm, "$1• ");
      })}
    </Text>
  );
}
