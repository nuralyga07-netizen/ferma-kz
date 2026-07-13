"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Phone, Image, Paperclip, ChevronLeft, User, Check, CheckCheck } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "me" | "farmer";
  time: string;
  read: boolean;
}

const initialMessages: Message[] = [
  { id: 1, text: "Здравствуйте! Меня интересует говядина парная", sender: "me", time: "10:23", read: true },
  { id: 2, text: "Здравствуйте! Да, говядина свежая, сегодня утром забили", sender: "farmer", time: "10:25", read: true },
  { id: 3, text: "Сколько кг могу заказать?", sender: "me", time: "10:26", read: true },
  { id: 4, text: "Хоть 10 кг, есть в наличии. Могу привезти в субботу", sender: "farmer", time: "10:28", read: true },
  { id: 5, text: "Отлично! Закажу 3 кг. Во сколько можете подъехать?", sender: "me", time: "10:30", read: false },
];

const farmers = [
  { id: 1, name: "Ферма «Акжол»", avatar: "А", lastMessage: "Во сколько можете подъехать?", time: "10:30", unread: 1, online: true },
  { id: 2, name: "ИП «Беркут»", avatar: "Б", lastMessage: "500 кг/кг", time: "Вчера", unread: 0, online: false },
  { id: 3, name: "КХ «Атамекен»", avatar: "А", lastMessage: "Привезём в пятницу", time: "12 июля", unread: 0, online: true },
];

export function Chat() {
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  const currentChat = farmers.find((f) => f.id === selectedChat);

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-3xl overflow-hidden glass-card">
      {/* Chat List */}
      <AnimatePresence>
        {(showMobileList || !selectedChat) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full sm:w-80 lg:w-96 border-r border-border flex flex-col shrink-0"
          >
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Сообщения</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{farmers.length} чата</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {farmers.map((farmer) => (
                <button
                  key={farmer.id}
                  onClick={() => { setSelectedChat(farmer.id); setShowMobileList(false); }}
                  className={`w-full flex items-center gap-3 p-4 border-b border-border hover:bg-muted/50 transition-all text-left ${
                    selectedChat === farmer.id ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold">
                      {farmer.avatar}
                    </div>
                    {farmer.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{farmer.name}</span>
                      <span className="text-[10px] text-muted-foreground">{farmer.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{farmer.lastMessage}</p>
                  </div>
                  {farmer.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium">{farmer.unread}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      {selectedChat && currentChat && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <button
                onClick={() => setShowMobileList(true)}
                className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                  {currentChat.avatar}
                </div>
                {currentChat.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{currentChat.name}</p>
                <p className="text-xs text-emerald-500">{currentChat.online ? "Онлайн" : "Был(а) недавно"}</p>
              </div>
              <button className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-all">
                <Phone className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl ${
                      msg.sender === "me"
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    }`}>
                      <span className={`text-[10px] ${
                        msg.sender === "me" ? "text-white/60" : "text-muted-foreground"
                      }`}>{msg.time}</span>
                      {msg.sender === "me" && (
                        msg.read ? <CheckCheck className="w-3 h-3 text-white/60" /> : <Check className="w-3 h-3 text-white/60" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-all shrink-0">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-all shrink-0">
                  <Image className="w-4 h-4 text-muted-foreground" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Напишите сообщение..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
