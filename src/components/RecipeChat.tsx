import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage, Recipe } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  ANTHROPIC_API_KEY_STORAGE,
  buildRecipeSystemPrompt,
  sendChatMessage,
} from "../utils/chat";

interface RecipeChatProps {
  recipe: Recipe;
  onUpdateChat: (messages: ChatMessage[]) => void;
}

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const SPEAK_REPLIES_KEY = "grocery-app:speak-replies";

export function RecipeChat({ recipe, onUpdateChat }: RecipeChatProps) {
  const [apiKey, setApiKey] = useLocalStorage(ANTHROPIC_API_KEY_STORAGE, "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [speakReplies, setSpeakReplies] = useLocalStorage(SPEAK_REPLIES_KEY, false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const messages = recipe.chatHistory;
  const speechSupported = getSpeechRecognitionCtor() !== null;
  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (ttsSupported) window.speechSynthesis.cancel();
    };
  }, [ttsSupported]);

  function speak(text: string) {
    if (!speakReplies || !ttsSupported) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function toggleListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const history = [...messages, { role: "user", content: text } as ChatMessage];
    onUpdateChat(history);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const reply = await sendChatMessage(apiKey, buildRecipeSystemPrompt(recipe), history);
      onUpdateChat([...history, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveApiKey(e: FormEvent) {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setApiKeyInput("");
  }

  if (!apiKey) {
    return (
      <div className="recipe-chat">
        <h3>Ask while you cook</h3>
        <p className="form-hint">
          Enter your Anthropic API key to chat with this recipe — for example, "I just
          added the butter, what's next?" The key is stored only in your browser and
          used to talk to Claude directly.
        </p>
        <form onSubmit={handleSaveApiKey} className="chat-input-row">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-ant-…"
          />
          <button type="submit" className="btn btn-primary" disabled={!apiKeyInput.trim()}>
            Save
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="recipe-chat">
      <div className="recipe-chat-header">
        <h3>Ask while you cook</h3>
        <label className="chat-toggle">
          <input
            type="checkbox"
            checked={speakReplies}
            onChange={(e) => setSpeakReplies(e.target.checked)}
            disabled={!ttsSupported}
          />
          <span>Speak replies</span>
        </label>
      </div>

      {messages.length > 0 && (
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && <div className="chat-message assistant chat-loading">Thinking…</div>}
          <div ref={messagesEndRef} />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSend} className="chat-input-row">
        {speechSupported && (
          <button
            type="button"
            className={`btn btn-secondary mic-btn ${listening ? "listening" : ""}`}
            onClick={toggleListening}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            title={listening ? "Stop voice input" : "Start voice input"}
          >
            🎤
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
