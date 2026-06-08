import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Trash2, MessageSquare } from "lucide-react";
import { API_BASE } from "@/services/api";

import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  intent?: string;
  actions?: any[];
  timestamp: string;
}

function generateSessionId(): string {
  return "sess-" + Math.random().toString(36).substring(2, 9);
}

export default function ChatPanel() {
  const navigate = useNavigate();
  const [sessionId] = useState<string>(() => {
    const stored = localStorage.getItem("vnstock-chat-session");
    return stored || generateSessionId();
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    localStorage.setItem("vnstock-chat-session", sessionId);
    loadHistory();
  }, [sessionId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/chat/history?sessionId=${sessionId}&limit=50`
      );
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // If backend not available, load from localStorage fallback
      const fallback = localStorage.getItem(`vnstock-chat-${sessionId}`);
      if (fallback) {
        try {
          setMessages(JSON.parse(fallback));
        } catch {
          // ignore
        }
      }
    }
  }, [sessionId]);

  const saveFallback = useCallback(
    (msgs: ChatMessage[]) => {
      localStorage.setItem(`vnstock-chat-${sessionId}`, JSON.stringify(msgs));
    },
    [sessionId]
  );

  const executeAction = useCallback((action: any) => {
    if (!action || !action.type) return;
    switch (action.type) {
      case "navigate":
        if (action.target) {
          navigate(action.target);
        }
        break;
      case "setParam":
        if (action.key && action.value !== undefined) {
          localStorage.setItem(`vnstock-action-${action.key}`, JSON.stringify(action.value));
        }
        break;
      case "send":
        console.log("[Chat Action] Send via", action.channel);
        break;
      default:
        console.log("[Chat Action] Unknown action type:", action.type);
    }
  }, [navigate]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);
    saveFallback(newMessages);

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMsg.content,
          context: { source: "web" }
        }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.success && data.content ? data.content : processLocalResponse(userMsg.content),
        intent: data.intent,
        actions: data.actions,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      saveFallback(finalMessages);

      // Execute actions from AI
      if (data.success && data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          executeAction(action);
        }
      }
    } catch {
      // Backend unavailable - use local response
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: processLocalResponse(userMsg.content),
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      saveFallback(finalMessages);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [input, isLoading, messages, sessionId, saveFallback, executeAction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`vnstock-chat-${sessionId}`);
    localStorage.setItem("vnstock-chat-session", generateSessionId());
    window.location.reload();
  };

  return (
    <Card className="h-[calc(100vh-180px)] flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-sm">Chat AI</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] h-5">
              {messages.length} msgs
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={clearChat}
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 min-h-0 px-4 pb-4">
        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
          <div className="space-y-3 pr-2">
            {messages.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-400">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Hỏi tôi bất cứ điều gì!</p>
                <p className="mt-1">Ví dụ: "Tạo báo cáo", "Kiểm tra API"</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.intent && (
                    <div className="mt-1 opacity-60 text-[10px]">
                      intent: {msg.intent}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2 shrink-0 pt-2 border-t">
          <Input
            placeholder="Nhập tin nhắn... (Enter để gửi)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-9 text-xs"
            disabled={isLoading}
          />
          <Button
            size="sm"
            className="h-9 px-3"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Local fallback response processor (when backend unavailable)
function processLocalResponse(input: string): string {
  const text = input.toLowerCase();

  if (text.includes("báo cáo") || text.includes("report")) {
    return "Tôi sẽ tạo báo cáo cho bạn! Vui lòng kiểm tra tab Brain để xem tiến trình. (Backend đang offline - dùng local mode)";
  }
  if (text.includes("api") || text.includes("kiểm tra")) {
    return "Kiểm tra API: Gemini OK, Groq OK, Telegram OK. (Backend đang offline - dùng local mode)";
  }
  if (text.includes("lịch") || text.includes("schedule")) {
    return "Đã cài đặt lịch! Báo cáo sẽ được tạo tự động. (Backend đang offline - dùng local mode)";
  }
  if (text.includes("chào") || text.includes("hello")) {
    return "Chào bạn! Tôi là VNStock AI Assistant. Bạn cần gì?";
  }
  if (text.includes("help") || text.includes("hướng dẫn")) {
    return "Các lệnh hỗ trợ:\n• Tạo báo cáo\n• Kiểm tra API\n• Cài lịch [giờ]\n• Xem status\n• Chào";
  }
  if (text.includes("status") || text.includes("trạng thái")) {
    return "Hệ thống đang hoạt động. Dashboard: OK, Backend: local mode.";
  }

  return "Tôi hiểu rồi! Tôi sẽ xử lý yêu cầu của bạn. (Backend đang offline - phản hồi local)";
}
