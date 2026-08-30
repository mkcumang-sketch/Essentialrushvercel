"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  ChevronDown,
  Clock,
  CreditCard,
  Headphones,
  Maximize2,
  Minimize2,
  Package,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type MessageSender = "user" | "ai";

interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: number;
  status?: "sending" | "sent" | "error";
}

interface QuickAction {
  label: string;
  query: string;
  icon: React.ElementType;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WELCOME_MESSAGE =
  "Welcome to Essential Rush. I am MYRIO, your private horology concierge. I can assist with timepieces, provenance, orders, payments, returns, and acquisition guidance. How may I assist you today?";

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Track Order",
    query: "Where is my order?",
    icon: Package,
  },
  {
    label: "Discover",
    query: "Recommend luxury watches based on current availability.",
    icon: Clock,
  },
  {
    label: "Payment",
    query: "What payment methods do you accept?",
    icon: CreditCard,
  },
  {
    label: "Returns",
    query: "What is your return policy?",
    icon: RotateCcw,
  },
  {
    label: "Human Concierge",
    query: "I need assistance from a human concierge.",
    icon: Headphones,
  },
];

const createMessage = (
  sender: MessageSender,
  text: string,
  status: ChatMessage["status"] = "sent"
): ChatMessage => ({
  id: `${sender}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`,
  sender,
  text,
  createdAt: Date.now(),
  status,
});

// ============================================================================
// COMPONENT
// ============================================================================

export default function AskMyrioWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [sessionId] = useState(
    () => `sess-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`
  );

  const [inputQuery, setInputQuery] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage("ai", WELCOME_MESSAGE),
  ]);

  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    return new Intl.DateTimeFormat("en", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  }, []);

  const resetConversation = useCallback(() => {
    if (loading) return;

    setMessages([createMessage("ai", WELCOME_MESSAGE)]);
    setInputQuery("");
    setHasUnread(false);

    window.setTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom("auto");
    }, 100);
  }, [loading, scrollToBottom]);

  // ==========================================================================
  // API
  // ==========================================================================

  const sendQueryToMyrio = useCallback(
    async (queryText: string) => {
      const clean = queryText.trim();

      if (!clean || loading) return;

      const userMessage = createMessage("user", clean);

      setMessages((prev) => [...prev, userMessage]);
      setInputQuery("");
      setLoading(true);

      window.setTimeout(() => scrollToBottom(), 50);

      try {
        const res = await fetch("/api/myrio/customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            query: clean,
          }),
        });

        let data: any = null;

        try {
          data = await res.json();
        } catch {
          throw new Error("Invalid response received from MYRIO.");
        }

        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "MYRIO could not process the request."
          );
        }

        if (data?.success && data?.response) {
          setMessages((prev) => [
            ...prev,
            createMessage("ai", String(data.response)),
          ]);

          if (!isOpen) {
            setHasUnread(true);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            createMessage(
              "ai",
              "I encountered a retrieval issue while consulting the Essential Rush intelligence system. Please try your request again."
            ),
          ]);
        }
      } catch (error) {
        console.error("MYRIO customer assistant error:", error);

        setMessages((prev) => [
          ...prev,
          createMessage(
            "ai",
            "My connection to the intelligence vault was interrupted. Please check your connection and try again."
          ),
        ]);
      } finally {
        setLoading(false);

        window.setTimeout(() => {
          scrollToBottom();
          inputRef.current?.focus();
        }, 80);
      }
    },
    [isOpen, loading, scrollToBottom, sessionId]
  );

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (!isOpen) return;

    setHasUnread(false);

    window.setTimeout(() => {
      scrollToBottom("auto");
      inputRef.current?.focus();
    }, 150);
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => scrollToBottom(), 50);
    }
  }, [messages, loading, isOpen, scrollToBottom]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // ==========================================================================
  // SCROLL STATE
  // ==========================================================================

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;

    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;

    setShowScrollButton(distanceFromBottom > 120);
  }, []);

  // ==========================================================================
  // DERIVED DATA
  // ==========================================================================

  const conversationCount = useMemo(
    () => messages.filter((message) => message.sender === "user").length,
    [messages]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* ===================================================================
          FLOATING LAUNCHER
      =================================================================== */}

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{
              scale: 0.75,
              opacity: 0,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.85,
              opacity: 0,
            }}
            whileHover={{
              scale: 1.04,
              y: -2,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="
              relative
              group
              overflow-visible
              bg-gradient-to-r
              from-[#B88A28]
              via-[#F1D675]
              to-[#D4AF37]
              text-black
              px-5
              sm:px-6
              py-3.5
              rounded-full
              font-black
              uppercase
              text-[10px]
              sm:text-[11px]
              tracking-[0.19em]
              shadow-[0_12px_45px_rgba(212,175,55,0.28)]
              flex
              items-center
              gap-2.5
              cursor-pointer
              border
              border-white/30
            "
          >
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />

            <span className="relative flex items-center justify-center">
              <Sparkles size={15} />

              <span className="absolute inset-0 rounded-full animate-ping bg-black/10 opacity-30" />
            </span>

            <span className="relative">Ask MYRIO</span>

            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#07090b]">
                <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-70" />
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===================================================================
          CHAT WINDOW
      =================================================================== */}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-[2px] sm:hidden -z-10"
            />

            <motion.section
              initial={{
                opacity: 0,
                y: 35,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 25,
                scale: 0.96,
              }}
              transition={{
                type: "spring",
                damping: 26,
                stiffness: 300,
              }}
              className={`
                relative
                bg-[#090B0E]/95
                border
                border-white/[0.12]
                flex
                flex-col
                overflow-hidden
                backdrop-blur-3xl

                fixed
                sm:absolute

                ${
                  isExpanded
                    ? "inset-3 sm:inset-auto sm:right-0 sm:bottom-0 sm:w-[720px] sm:h-[720px] rounded-[28px]"
                    : "inset-x-3 bottom-3 h-[calc(100dvh-24px)] sm:inset-auto sm:right-0 sm:bottom-0 sm:w-[410px] sm:h-[610px] rounded-[26px]"
                }

                shadow-[0_30px_90px_rgba(0,0,0,0.85)]
              `}
            >
              {/* Decorative glow */}

              <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="absolute top-24 -left-40 w-72 h-72 bg-white/[0.03] blur-[100px] rounded-full pointer-events-none" />

              {/* ===========================================================
                  HEADER
              =========================================================== */}

              <header className="relative z-10 bg-black/45 backdrop-blur-xl px-4 sm:px-5 py-4 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#D4AF37]/25 to-[#D4AF37]/5 border border-[#D4AF37]/35 flex items-center justify-center text-[#E9C85A] shadow-[0_0_30px_rgba(212,175,55,0.12)]">
                        <Bot size={19} />
                      </div>

                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-[2.5px] border-[#0A0C0F]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.22em] text-white">
                          MYRIO
                        </h3>

                        <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black uppercase tracking-[0.13em] text-emerald-400">
                          Online
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck
                          size={10}
                          className="text-[#D4AF37]"
                        />

                        <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">
                          Private Horology Intelligence
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={resetConversation}
                      disabled={loading}
                      title="New conversation"
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-white/10 text-gray-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <RefreshCw size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExpanded((prev) => !prev)}
                      title={isExpanded ? "Minimize" : "Expand"}
                      className="hidden sm:flex w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-transparent hover:border-white/10 text-gray-500 hover:text-white items-center justify-center transition-all cursor-pointer"
                    >
                      {isExpanded ? (
                        <Minimize2 size={13} />
                      ) : (
                        <Maximize2 size={13} />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      title="Close MYRIO"
                      className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-red-500/10 hover:border-red-500/20 border border-transparent text-gray-500 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Session metadata */}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[8px] uppercase tracking-[0.14em] text-gray-600">
                    <span className="flex items-center gap-1">
                      <Zap size={9} className="text-[#D4AF37]" />
                      Neural Concierge
                    </span>

                    <span>•</span>

                    <span>{conversationCount} inquiries</span>
                  </div>

                  <span className="text-[8px] font-mono text-gray-700 hidden sm:block">
                    {sessionId.slice(-8).toUpperCase()}
                  </span>
                </div>
              </header>

              {/* ===========================================================
                  QUICK ACTIONS
              =========================================================== */}

              <div
                className="
                  relative
                  z-10
                  px-3.5
                  py-2.5
                  bg-black/25
                  border-b
                  border-white/[0.05]
                  flex
                  gap-2
                  overflow-x-auto
                  shrink-0
                  [&::-webkit-scrollbar]:hidden
                  [-ms-overflow-style:none]
                  [scrollbar-width:none]
                "
              >
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      disabled={loading}
                      onClick={() => sendQueryToMyrio(action.query)}
                      className="
                        group
                        px-3.5
                        py-2
                        rounded-xl
                        bg-white/[0.035]
                        border
                        border-white/[0.08]
                        hover:border-[#D4AF37]/50
                        hover:bg-[#D4AF37]/[0.07]
                        text-[9px]
                        font-semibold
                        text-gray-400
                        hover:text-white
                        tracking-wide
                        shrink-0
                        transition-all
                        flex
                        items-center
                        gap-1.5
                        cursor-pointer
                        disabled:opacity-40
                      "
                    >
                      <Icon
                        size={11}
                        className="text-[#BFA039] group-hover:text-[#E4C556]"
                      />

                      {action.label}
                    </button>
                  );
                })}
              </div>

              {/* ===========================================================
                  MESSAGES
              =========================================================== */}

              <div className="relative flex-1 min-h-0">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleMessagesScroll}
                  className="
                    absolute
                    inset-0
                    overflow-y-auto
                    overscroll-contain
                    px-4
                    sm:px-5
                    py-5
                    space-y-5
                    [&::-webkit-scrollbar]:w-1
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-white/10
                    [&::-webkit-scrollbar-thumb]:rounded-full
                  "
                >
                  {messages.map((message) => {
                    const isUser = message.sender === "user";

                    return (
                      <motion.div
                        key={message.id}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className={`flex items-start gap-2.5 ${
                          isUser ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {/* Avatar */}

                        <div
                          className={`
                            w-7
                            h-7
                            rounded-xl
                            shrink-0
                            flex
                            items-center
                            justify-center
                            ${
                              isUser
                                ? "bg-[#D4AF37] text-black"
                                : "bg-white/[0.06] border border-white/[0.1] text-[#D4AF37]"
                            }
                          `}
                        >
                          {isUser ? (
                            <User size={12} />
                          ) : (
                            <Bot size={12} />
                          )}
                        </div>

                        <div
                          className={`flex flex-col ${
                            isUser ? "items-end" : "items-start"
                          } max-w-[82%]`}
                        >
                          {/* Message bubble */}

                          <div
                            className={`
                              relative
                              px-3.5
                              py-3
                              text-[12px]
                              leading-[1.7]
                              whitespace-pre-wrap
                              break-words
                              ${
                                isUser
                                  ? `
                                    bg-gradient-to-br
                                    from-[#E0BE4C]
                                    to-[#C69E27]
                                    text-black
                                    rounded-2xl
                                    rounded-tr-[5px]
                                    font-medium
                                    shadow-[0_8px_24px_rgba(212,175,55,0.12)]
                                  `
                                  : `
                                    bg-white/[0.045]
                                    border
                                    border-white/[0.08]
                                    text-gray-200
                                    rounded-2xl
                                    rounded-tl-[5px]
                                  `
                              }
                            `}
                          >
                            {message.text}
                          </div>

                          {/* Timestamp */}

                          <div
                            className={`
                              mt-1.5
                              px-1
                              text-[8px]
                              font-mono
                              uppercase
                              tracking-[0.12em]
                              ${
                                isUser
                                  ? "text-gray-600"
                                  : "text-gray-700"
                              }
                            `}
                          >
                            {isUser ? "You" : "MYRIO"} ·{" "}
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Typing indicator */}

                  <AnimatePresence>
                    {loading && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="flex items-start gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center bg-white/[0.06] border border-white/[0.1] text-[#D4AF37]">
                          <Bot size={12} />
                        </div>

                        <div className="bg-white/[0.045] border border-white/[0.08] rounded-2xl rounded-tl-[5px] px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map((dot) => (
                              <motion.span
                                key={dot}
                                animate={{
                                  opacity: [0.25, 1, 0.25],
                                  y: [0, -2, 0],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  delay: dot * 0.17,
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
                              />
                            ))}
                          </div>

                          <p className="text-[9px] text-gray-500 mt-2 font-serif italic">
                            Consulting Essential Rush intelligence...
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} className="h-1" />
                </div>

                {/* Scroll-to-bottom */}

                <AnimatePresence>
                  {showScrollButton && (
                    <motion.button
                      type="button"
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      onClick={() => scrollToBottom()}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#15181C] border border-white/10 shadow-xl flex items-center justify-center text-gray-400 hover:text-white hover:border-[#D4AF37]/50 transition-all cursor-pointer"
                    >
                      <ChevronDown size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* ===========================================================
                  INPUT FOOTER
              =========================================================== */}

              <footer className="relative z-20 p-3 sm:p-4 border-t border-white/[0.08] bg-black/55 backdrop-blur-xl shrink-0">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendQueryToMyrio(inputQuery);
                  }}
                  className="
                    group
                    relative
                    flex
                    items-center
                    gap-2
                    bg-white/[0.035]
                    border
                    border-white/[0.09]
                    focus-within:border-[#D4AF37]/60
                    focus-within:bg-white/[0.05]
                    rounded-[18px]
                    p-1.5
                    transition-all
                    shadow-inner
                  "
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputQuery}
                    onChange={(event) =>
                      setInputQuery(event.target.value)
                    }
                    disabled={loading}
                    maxLength={1000}
                    autoComplete="off"
                    placeholder={
                      loading
                        ? "MYRIO is analyzing..."
                        : "Ask about watches, orders, provenance..."
                    }
                    className="
                      flex-1
                      min-w-0
                      bg-transparent
                      px-3
                      py-2.5
                      text-[12px]
                      text-white
                      placeholder:text-gray-600
                      outline-none
                      disabled:opacity-60
                    "
                  />

                  <motion.button
                    type="submit"
                    disabled={loading || !inputQuery.trim()}
                    whileTap={{
                      scale: 0.92,
                    }}
                    className="
                      w-10
                      h-10
                      bg-gradient-to-br
                      from-[#E2C355]
                      to-[#C49C2C]
                      hover:from-white
                      hover:to-[#E9E9E9]
                      text-black
                      rounded-[14px]
                      transition-all
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                      cursor-pointer
                      flex
                      items-center
                      justify-center
                      shrink-0
                      shadow-[0_6px_20px_rgba(212,175,55,0.18)]
                    "
                  >
                    {loading ? (
                      <RefreshCw
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={14} />
                    )}
                  </motion.button>
                </form>

                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                  <ShieldCheck
                    size={9}
                    className="text-gray-700"
                  />

                  <p className="text-[8px] text-gray-700 uppercase tracking-[0.15em]">
                    Essential Rush Secure Concierge
                  </p>
                </div>
              </footer>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}