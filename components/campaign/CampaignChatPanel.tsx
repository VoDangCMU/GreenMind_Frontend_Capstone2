"use client";

import { useEffect, useRef, useState } from "react";
import { useCampaignChat, ChatMessage } from "@/hooks/useCampaignChat";
import { getStoredUser } from "@/lib/auth";
import { Send, Wifi, WifiOff, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CampaignChatPanelProps {
  campaignId: string;
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDateLabel(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Gom tin nhắn theo ngày để hiển thị date separator */
function groupByDate(messages: ChatMessage[]) {
  const groups: { date: string; items: ChatMessage[] }[] = [];
  let lastDate = "";
  for (const msg of messages) {
    const d = formatDateLabel(msg.createdAt);
    if (d !== lastDate) {
      groups.push({ date: d, items: [] });
      lastDate = d;
    }
    groups[groups.length - 1].items.push(msg);
  }
  return groups;
}

export function CampaignChatPanel({ campaignId }: CampaignChatPanelProps) {
  const { messages, connected, error, loadingHistory, sendMessage } =
    useCampaignChat(campaignId);

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUser = getStoredUser();
  const currentUserId = currentUser?.id ?? "";

  // Auto-scroll khi có tin mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50">
      {/* ── Status Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-700">Chat Chiến dịch</span>
        </div>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-600 font-medium">Đã kết nối</span>
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-300"></span>
              <span className="text-xs text-slate-400 font-medium">Đang kết nối...</span>
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
            </>
          )}
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mt-3 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Messages ─────────────────────────────────────────────── */}
      <ScrollArea className="flex-1 min-h-0 px-4 py-3">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-sm">Đang tải lịch sử chat...</p>
          </div>
        ) : messages.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <MessageCircle className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium">Chưa có tin nhắn nào.</p>
            <p className="text-xs text-slate-400">Hãy là người đầu tiên gửi tin!</p>
          </div>
        ) : (
          <div className="space-y-1 pb-2">
            {groups.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                    {group.date}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {group.items.map((msg, idx) => {
                  const isMe = msg.sender?.id === currentUserId;
                  const prevMsg = idx > 0 ? group.items[idx - 1] : null;
                  const isSameAuthor = prevMsg?.sender?.id === msg.sender?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${
                        isSameAuthor ? "mt-1" : "mt-3"
                      }`}
                    >
                      {/* Avatar */}
                      {!isMe && (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${
                            isSameAuthor ? "opacity-0" : "bg-gradient-to-br from-blue-400 to-blue-600"
                          }`}
                        >
                          {msg.sender?.fullName?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                        {/* Sender name (chỉ hiện cho người khác, lần đầu) */}
                        {!isMe && !isSameAuthor && (
                          <span className="text-xs text-slate-500 font-semibold mb-1 ml-1">
                            {msg.sender?.fullName || "Ẩn danh"}
                          </span>
                        )}

                        {/* Bubble */}
                        <div
                          className={`relative px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
                            isMe
                              ? "bg-blue-500 text-white rounded-br-md"
                              : "bg-white text-slate-800 border border-slate-100 rounded-bl-md"
                          }`}
                          style={{ wordBreak: "break-word" }}
                        >
                          {msg.content}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[10px] text-slate-400 mt-0.5 mx-1">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      {/* My avatar */}
                      {isMe && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white bg-gradient-to-br from-emerald-400 to-emerald-600">
                          {currentUser?.fullName?.charAt(0).toUpperCase() || "T"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* ── Input Box ────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 bg-white border-t border-slate-100">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            disabled={!connected}
            placeholder={connected ? "Nhập tin nhắn... (Enter để gửi)" : "Đang kết nối..."}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-50 py-1 max-h-[120px] overflow-y-auto leading-5"
            style={{ height: "28px" }}
          />
          <button
            onClick={handleSend}
            disabled={!connected || !input.trim()}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all duration-150 active:scale-95 mb-0.5"
            aria-label="Gửi tin nhắn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
          Shift+Enter để xuống dòng
        </p>
      </div>
    </div>
  );
}
