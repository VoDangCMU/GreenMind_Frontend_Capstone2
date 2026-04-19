"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth";

export interface ChatSender {
  id: string;
  fullName: string;
  role: string;
}

export interface ChatMessage {
  id: string;
  campaignId: string;
  sender: ChatSender;
  content: string;
  createdAt: string;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://vodang-api.gauas.com";
const PAGE_SIZE = 20;

export function useCampaignChat(campaignId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // ── Refs (stable across renders) ───────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const campaignIdRef = useRef<string | null>(null);
  const isActiveRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX #3: Store the current messages count as a ref to avoid stale closure
  // in loadMore. Updated every time messages state changes.
  const messagesCountRef = useRef(0);
  // FIX: Track whether a message send is in-flight to prevent double-send
  const isSendingRef = useRef(false);

  // Keep messagesCountRef in sync whenever messages changes
  useEffect(() => {
    messagesCountRef.current = messages.length;
  }, [messages]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // FIX #2: Never mutate arrays. Always use [...arr].reverse() or slice().reverse()
  function safeReverse<T>(arr: T[]): T[] {
    return [...arr].reverse();
  }

  // ── Fetch history ────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (id: string) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/campaigns/${id}/messages?skip=0&take=50`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" }
      );

      if (!res.ok) {
        if (res.status === 403)
          setError("Bạn không có quyền xem chat của chiến dịch này.");
        else if (res.status === 401)
          setError("Vui lòng đăng nhập để xem chat.");
        else setError("Không thể tải lịch sử chat.");
        return;
      }

      const data = await res.json();
      const list: ChatMessage[] = data?.data ?? [];
      // Backend đã .reverse() rồi → trả về ASC (cũ → mới). Không reverse lại!
      setMessages(list);
    } catch {
      setError("Lỗi kết nối khi tải lịch sử chat.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Load more ────────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!campaignId || loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const token = getAccessToken();
      // FIX #1: Read from ref instead of stale closure.
      // messagesCountRef.current is always the latest value.
      const skipOffset = messagesCountRef.current;
      const res = await fetch(
        `${API_URL}/campaigns/${campaignId}/messages?skip=${skipOffset}&take=${PAGE_SIZE}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: "no-store" }
      );

      if (!res.ok) {
        setLoadingMore(false);
        return;
      }

      const data = await res.json();
      const older: ChatMessage[] = data?.data ?? [];

      if (older.length === 0) {
        setHasMore(false);
      } else {
        // Backend trả DESC (mới nhất trước). older chứa tin cũ hơn current oldest.
        // Reverse để chuyển sang ASC, rồi prepend: [...older ASC, ...prev ASC]
        const olderAsc = [...older].reverse();
        setMessages((prev) => [...olderAsc, ...prev]);
        if (older.length < PAGE_SIZE) setHasMore(false);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoadingMore(false);
    }
  }, [campaignId, loadingMore, hasMore]);

  // ── Socket.IO effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!campaignId) return;

    isActiveRef.current = true;
    campaignIdRef.current = campaignId;
    reconnectAttemptRef.current = 0;
    setMessages([]);
    setError(null);
    setStatus("idle");
    setHasMore(true);
    setTypingUsers([]);

    fetchHistory(campaignId);

    const token = getAccessToken();
    // FIX #3: Use websocket-only transport. When "polling" + "websocket" are
    // both enabled, Socket.IO may create duplicate connections during the
    // upgrade handshake, causing duplicate messages over both transports.
    const socket = io(API_URL, {
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;
    setStatus("connecting");

    // ── Connection handlers ──────────────────────────────────────────────
    socket.on("connect", () => {
      if (!isActiveRef.current) return;
      setStatus("connected");
      setError(null);
      reconnectAttemptRef.current = 0;
      socket.emit("join_campaign", { campaignId });
    });

    socket.on("disconnect", () => {
      if (!isActiveRef.current) return;
      setStatus("reconnecting");
    });

    socket.on("connect_error", () => {
      if (!isActiveRef.current) return;
      reconnectAttemptRef.current += 1;
      if (reconnectAttemptRef.current >= 5) {
        setStatus("failed");
        setError("Không thể kết nối tới server chat.");
      } else {
        setStatus("reconnecting");
      }
    });

    socket.on("reconnect_attempt", () => {
      if (!isActiveRef.current) return;
      setStatus("reconnecting");
    });

    socket.on("reconnect_failed", () => {
      if (!isActiveRef.current) return;
      setStatus("failed");
      setError("Mất kết nối. Vui lòng nhấn Thử lại.");
    });

    // ── Message handler with full deduplication ────────────────────────────
    socket.on("new_message", (msg: ChatMessage) => {
      // FIX #3: Block events from stale sockets or wrong campaigns
      if (!isActiveRef.current || campaignIdRef.current !== campaignId) return;

      setMessages((prev) => {
        // Primary dedup: by message UUID (set in DB, guaranteed unique)
        const byId = prev.some((m) => m.id === msg.id);
        if (byId) return prev;

        // Secondary dedup: if same sender sent same content within 2 seconds,
        // it's almost certainly a backend duplicate — discard
        const now = Date.now();
        const within2Sec = prev.some(
          (m) =>
            m.sender?.id === msg.sender?.id &&
            m.content === msg.content &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 2000
        );
        if (within2Sec) {
          console.warn("[chat] Dropped probable duplicate:", msg.id);
          return prev;
        }

        return [...prev, msg];
      });
    });

    // ── Typing indicator ────────────────────────────────────────────────
    socket.on(
      "user_typing",
      (payload: { userId: string; fullName: string }) => {
        if (!isActiveRef.current) return;
        setTypingUsers((prev) => {
          if (prev.includes(payload.fullName)) return prev;
          return [...prev, payload.fullName];
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== payload.fullName));
        }, 3000);
      }
    );

    socket.on("error", (payload: { message: string }) => {
      if (!isActiveRef.current) return;
      setError(payload?.message || "Đã xảy ra lỗi trong phòng chat.");
    });

    return () => {
      // FIX #3: Mark inactive FIRST (synchronously) — blocks any in-flight
      // events before disconnect() is called. This prevents race between
      // cleanup and arriving socket events.
      isActiveRef.current = false;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [campaignId, fetchHistory]);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !campaignId || !content.trim()) return;
      // FIX: Prevent rapid double-send (double-click, Enter key bounce)
      if (isSendingRef.current) return;
      isSendingRef.current = true;
      socketRef.current.emit("send_message", {
        campaignId,
        content: content.trim(),
      });
      socketRef.current.emit("stop_typing", { campaignId });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      // Reset guard after a short delay — protects against rapid sends
      setTimeout(() => {
        isSendingRef.current = false;
      }, 500);
    },
    [campaignId]
  );

  // ── Typing indicator ────────────────────────────────────────────────────
  const startTyping = useCallback(() => {
    if (!socketRef.current || !campaignId) return;
    socketRef.current.emit("typing", { campaignId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("stop_typing", { campaignId });
    }, 2000);
  }, [campaignId]);

  // ── Manual retry ────────────────────────────────────────────────────────
  const retryConnection = useCallback(() => {
    // FIX #3: Check that the socket is still valid (not already cleaned up)
    // and that this hook is still active before attempting reconnect.
    if (!socketRef.current || !isActiveRef.current || !campaignIdRef.current)
      return;
    reconnectAttemptRef.current = 0;
    socketRef.current.connect();
    setStatus("connecting");
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────
  const connected = status === "connected";

  return {
    messages,
    connected,
    status,
    error,
    loadingHistory,
    loadingMore,
    hasMore,
    typingUsers,
    sendMessage,
    loadMore,
    startTyping,
    retryConnection,
  };
}
