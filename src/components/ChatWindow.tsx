// src/components/ChatWindow.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Send, User, Loader } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { isMessageAllowed, extractPrice } from "@/utils/chatRules";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface ChatWindowProps {
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  originalPrice: number;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  isSystem?: boolean;
  amount?: number;
  sender?: string;
  created_at?: string;
}

export default function ChatWindow({
  sellerId,
  sellerName,
  productId,
  productName,
  originalPrice,
  onClose,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load or create conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Try to find existing conversation with this seller about this product
        const res = await fetch(`${API_URL}/api/chat/conversations/?participant=${sellerId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const conversations = await res.json();
          const existingConv = conversations.results?.find((c: any) =>
            c.participants.some((p: any) => p.id === sellerId)
          );

          if (existingConv) {
            setConversationId(existingConv.id);
            await loadMessages(existingConv.id, token);
          } else {
            // Create new conversation
            await createConversation(token);
          }
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [sellerId]);

  const createConversation = async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participants: [sellerId],
          listing_id: productId
        })
      });

      if (res.ok) {
        const conv = await res.json();
        setConversationId(conv.id);
      }
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  };

  const loadMessages = async (convId: number, token: string) => {
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/${convId}/messages/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        const msgs = (data.results || data).map((m: any) => ({
          id: m.id.toString(),
          text: m.content,
          sender: m.sender?.username,
          created_at: m.created_at
        }));
        setMessages(msgs);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !conversationId || sending) return;

    const result = isMessageAllowed(message);

    if (result === "block") {
      toast.error("Outside payment not allowed. Only bargaining in chat.");
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('access_token');

      // Send message via API
      const res = await fetch(`${API_URL}/api/chat/messages/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: message,
          message_type: 'text'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await res.json();

      // Add message to local state
      setMessages(prev => [...prev, {
        id: sentMessage.id.toString(),
        text: message,
        sender: 'me'
      }]);

      // Auto-detect offer
      if (result === "offer") {
        const amount = extractPrice(message);
        if (amount > 0 && amount < originalPrice * 2) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: `Offer: ₦${amount.toLocaleString()} for ${productName}`,
            isSystem: true,
            amount,
          }]);
          toast.success(`Offer ₦${amount.toLocaleString()} sent!`, {
            description: "Waiting for seller response",
          });
        }
      }

      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Chat Panel */}
      <div className="fixed bottom-0 left-0 right-0 h-[90vh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-t-3xl z-50 
                      md:right-4 md:bottom-4 md:top-20 md:w-96 md:h-[calc(100vh-6rem)] md:rounded-3xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-teal-800 p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{sellerName}</p>
              <p className="text-white/70 text-xs">Active now</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-600 text-white text-xs p-3 text-center font-bold flex-shrink-0">
          Bargain only • No outside payments • Violators banned instantly
        </div>

        {/* Messages Area - This is the scrollable part */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-white/50 text-sm mt-10">
              Start bargaining with {sellerName} • e.g. "4k last"
            </p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={msg.isSystem ? "mx-auto max-w-xs" : msg.sender === 'me' ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}>
                {msg.isSystem ? (
                  <div className="bg-gradient-to-r from-teal-600/20 to-purple-600/20 border border-teal-500/50 rounded-2xl p-4 text-center shadow-lg">
                    <p className="text-white font-black text-lg">₦{msg.amount?.toLocaleString()}</p>
                    <p className="text-white/80 text-sm">Offer for {productName}</p>
                    <div className="flex gap-2 mt-4 justify-center">
                      <button className="px-5 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-white font-bold text-sm transition">
                        Accept
                      </button>
                      <button className="px-5 py-2 bg-amber-600 hover:bg-amber-700 rounded-xl text-white font-bold text-sm transition">
                        Counter
                      </button>
                      <button className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold text-sm transition">
                        Decline
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`backdrop-blur-md rounded-2xl p-3 shadow-md ${msg.sender === 'me' ? 'bg-purple-600/80 text-white' : 'bg-white/10 text-white'}`}>
                    {msg.sender !== 'me' && (
                      <p className="text-xs text-white/70 mb-1">{msg.sender || sellerName}</p>
                    )}
                    {msg.text}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-slate-900/90 backdrop-blur-xl border-t border-white/10 p-4 flex-shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type your offer... e.g. 4k last"
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-white placeholder-white/50 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={handleSend}
              disabled={sending || loading || !conversationId}
              className={`p-3 rounded-xl transition shadow-lg ${
                sending || loading || !conversationId
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
              }`}
            >
              {sending ? (
                <Loader className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Send className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}