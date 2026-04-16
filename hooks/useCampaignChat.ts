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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://vodang-api.gauas.com";

export function useCampaignChat(campaignId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // ── Fetch lịch sử tin nhắn ──────────────────────────────────────────────────
  const fetchHistory = useCallback(async (id: string) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_URL}/campaigns/${id}/messages?skip=0&take=50`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        }
      );

      if (!res.ok) {
        if (res.status === 403) {
          setError("Bạn không có quyền xem chat của chiến dịch này.");
        } else if (res.status === 401) {
          setError("Vui lòng đăng nhập để xem chat.");
        } else {
          setError("Không thể tải lịch sử chat.");
        }
        return;
      }

      const data = await res.json();
      const list: ChatMessage[] = data?.data ?? [];
      // API trả về mới nhất trước → đảo lại để hiển thị đúng thứ tự
      setMessages(list.reverse());
    } catch {
      setError("Lỗi kết nối khi tải lịch sử chat.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Kết nối Socket.IO ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!campaignId) return;

    // Reset state khi đổi campaign
    setMessages([]);
    setError(null);
    setConnected(false);

    const token = getAccessToken();

    // Lấy lịch sử trước khi kết nối socket
    fetchHistory(campaignId);

    // Tạo socket với auth token
    const socket = io(API_URL, {
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
      // Join vào phòng chat của campaign
      socket.emit("join_campaign", { campaignId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setError("Không thể kết nối tới server chat.");
    });

    socket.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => {
        // Tránh duplicate nếu message đã có
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("error", (payload: { message: string }) => {
      setError(payload?.message || "Đã xảy ra lỗi trong phòng chat.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [campaignId, fetchHistory]);

  // ── Gửi tin nhắn ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !campaignId || !content.trim()) return;
      socketRef.current.emit("send_message", {
        campaignId,
        content: content.trim(),
      });
    },
    [campaignId]
  );

  return { messages, connected, error, loadingHistory, sendMessage };
}
