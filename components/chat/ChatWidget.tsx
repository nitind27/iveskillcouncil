"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Plus, Users, ChevronLeft,
  Search, Circle, Loader2, Hash,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatUser { id: string; fullName: string; email: string; roleId: number; franchiseName?: string | null; }
interface ChatMsg  { id: string; roomId: string; senderId: string; senderName: string; senderRole: number; body: string; msgType: string; fileUrl?: string | null; createdAt: string; isOwn: boolean; }
interface ChatRoom { id: string; type: string; name: string; slug?: string | null; lastMessage?: { body: string; senderName: string; createdAt: string } | null; unreadCount: number; members: { id: string; fullName: string; roleId: number }[]; updatedAt: string; }

const ROLE_LABEL: Record<number, string> = { 1: "Super Admin", 2: "Admin", 3: "Franchise Admin", 4: "Student", 5: "Staff" };
const ROLE_COLOR: Record<number, string> = { 1: "bg-[#2D5DA8]", 2: "bg-[#A8C63A]", 3: "bg-[#F39C12]", 4: "bg-emerald-500", 5: "bg-violet-500" };

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Avatar({ name, roleId, size = "sm" }: { name: string; roleId: number; size?: "sm" | "md" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-bold flex-shrink-0", sz, ROLE_COLOR[roleId] || "bg-gray-500")}>
      {initials}
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const [open,        setOpen]        = useState(false);
  const [view,        setView]        = useState<"rooms" | "chat" | "new" | "newGroup">("rooms");
  const [rooms,       setRooms]       = useState<ChatRoom[]>([]);
  const [activeRoom,  setActiveRoom]  = useState<ChatRoom | null>(null);
  const [messages,    setMessages]    = useState<ChatMsg[]>([]);
  const [chatUsers,   setChatUsers]   = useState<ChatUser[]>([]);
  const [search,      setSearch]      = useState("");
  const [msgText,     setMsgText]     = useState("");
  const [sending,     setSending]     = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [groupName,   setGroupName]   = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef         = useRef<EventSource | null>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const roleId = Number(user?.roleId);
  const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  // Load rooms
  const loadRooms = useCallback(async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      const res  = await fetch("/api/chat/rooms", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
        setTotalUnread(data.data.reduce((s: number, r: ChatRoom) => s + r.unreadCount, 0));
      }
    } finally { setLoadingRooms(false); }
  }, [user]);

  useEffect(() => { if (open) loadRooms(); }, [open, loadRooms]);

  // Load messages for active room
  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMsgs(true);
    try {
      const res  = await fetch(`/api/chat/rooms/${roomId}/messages`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } finally { setLoadingMsgs(false); }
  }, []);

  // SSE subscription
  useEffect(() => {
    if (!activeRoom) return;
    sseRef.current?.close();
    const es = new EventSource(`/api/chat/rooms/${activeRoom.id}/stream`);
    es.onmessage = (e) => {
      try {
        const msg: ChatMsg = JSON.parse(e.data);
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch { /* heartbeat */ }
    };
    sseRef.current = es;
    return () => { es.close(); sseRef.current = null; };
  }, [activeRoom]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat users for new chat
  useEffect(() => {
    if (view !== "new" && view !== "newGroup") return;
    fetch("/api/chat/users", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setChatUsers(d.data); });
  }, [view]);

  const openRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setView("chat");
    await loadMessages(room.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startDirectChat = async (targetUser: ChatUser) => {
    const res  = await fetch("/api/chat/rooms", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "direct", targetUserId: targetUser.id }),
    });
    const data = await res.json();
    if (data.success) {
      const room: ChatRoom = {
        id: data.data.id, type: "direct",
        name: targetUser.fullName, slug: data.data.slug,
        lastMessage: null, unreadCount: 0,
        members: [{ id: targetUser.id, fullName: targetUser.fullName, roleId: targetUser.roleId }],
        updatedAt: new Date().toISOString(),
      };
      setActiveRoom(room);
      setView("chat");
      setMessages([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0) return;
    const res  = await fetch("/api/chat/rooms", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "group", name: groupName, memberIds: groupMembers }),
    });
    const data = await res.json();
    if (data.success) {
      const room: ChatRoom = {
        id: data.data.id, type: "group", name: groupName,
        lastMessage: null, unreadCount: 0, members: [], updatedAt: new Date().toISOString(),
      };
      setActiveRoom(room);
      setView("chat");
      setMessages([]);
      setGroupName(""); setGroupMembers([]);
    }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeRoom || sending) return;
    const text = msgText.trim();
    setMsgText("");
    setSending(true);
    try {
      const res  = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }
    } finally { setSending(false); }
  };

  if (!user || (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN)) return null;

  const filteredUsers = chatUsers.filter((u) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.franchiseName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-[400] w-14 h-14 rounded-full bg-[#2D5DA8] text-white shadow-2xl flex items-center justify-center"
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="x"    initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}}><X className="w-6 h-6"/></motion.span>
            : <motion.span key="chat" initial={{rotate:90,opacity:0}}  animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}}><MessageSquare className="w-6 h-6"/></motion.span>
          }
        </AnimatePresence>
        {totalUnread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F39C12] text-white text-[10px] font-black flex items-center justify-center">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-[399] w-[360px] h-[520px] bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] flex flex-col overflow-hidden"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#2D5DA8] text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                {view !== "rooms" && (
                  <button onClick={() => { setView("rooms"); setActiveRoom(null); setMessages([]); loadRooms(); }} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                )}
                <div>
                  <p className="font-bold text-sm">
                    {view === "rooms"    ? "Messages" :
                     view === "new"      ? "New Chat" :
                     view === "newGroup" ? "New Group" :
                     activeRoom?.name ?? "Chat"}
                  </p>
                  {view === "chat" && activeRoom && (
                    <p className="text-[10px] text-white/70">
                      {activeRoom.type === "group" ? `${activeRoom.members.length + 1} members` : ROLE_LABEL[activeRoom.members[0]?.roleId] ?? ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {view === "rooms" && isAdmin && (
                  <>
                    <button onClick={() => { setView("new"); setSearch(""); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="New chat"><Plus className="w-4 h-4"/></button>
                    <button onClick={() => { setView("newGroup"); setSearch(""); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="New group"><Users className="w-4 h-4"/></button>
                  </>
                )}
                {view === "rooms" && !isAdmin && (
                  <button onClick={() => { setView("new"); setSearch(""); }} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="New chat"><Plus className="w-4 h-4"/></button>
                )}
              </div>
            </div>

            {/* ── Rooms list ── */}
            {view === "rooms" && (
              <div className="flex-1 overflow-y-auto">
                {loadingRooms ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-[#2D5DA8] animate-spin"/></div>
                ) : rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-[#9CA3AF]">
                    <MessageSquare className="w-10 h-10"/>
                    <p className="text-sm font-medium">No conversations yet</p>
                    <button onClick={() => { setView("new"); setSearch(""); }} className="text-xs text-[#2D5DA8] font-semibold hover:underline">Start a chat</button>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <button key={room.id} onClick={() => openRoom(room)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors border-b border-[#F3F4F6] last:border-0 text-left">
                      <div className="relative flex-shrink-0">
                        {room.type === "group"
                          ? <div className="w-9 h-9 rounded-full bg-[#A8C63A] flex items-center justify-center"><Hash className="w-4 h-4 text-white"/></div>
                          : <Avatar name={room.name} roleId={room.members[0]?.roleId ?? 3}/>
                        }
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F39C12] text-white text-[9px] font-black flex items-center justify-center">{room.unreadCount}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-sm font-semibold truncate", room.unreadCount > 0 ? "text-[#1A1A1A]" : "text-[#374151]")}>{room.name}</p>
                          {room.lastMessage && <span className="text-[10px] text-[#9CA3AF] flex-shrink-0 ml-1">{timeAgo(room.lastMessage.createdAt)}</span>}
                        </div>
                        {room.lastMessage && (
                          <p className="text-xs text-[#6B7280] truncate">{room.lastMessage.senderName}: {room.lastMessage.body}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── New direct chat ── */}
            {view === "new" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-[#E5E7EB]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"/>
                    <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2D5DA8]"/>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <button key={u.id} onClick={() => startDirectChat(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors border-b border-[#F3F4F6] last:border-0 text-left">
                      <Avatar name={u.fullName} roleId={u.roleId}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{u.fullName}</p>
                        <p className="text-xs text-[#6B7280]">{ROLE_LABEL[u.roleId]}{u.franchiseName ? ` · ${u.franchiseName}` : ""}</p>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && <p className="text-center text-sm text-[#9CA3AF] py-8">No users found</p>}
                </div>
              </div>
            )}

            {/* ── New group ── */}
            {view === "newGroup" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 py-2 border-b border-[#E5E7EB] space-y-2">
                  <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name..." className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2D5DA8]"/>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"/>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Add members..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2D5DA8]"/>
                  </div>
                  {groupMembers.length > 0 && (
                    <p className="text-xs text-[#6B7280]">{groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredUsers.map((u) => {
                    const selected = groupMembers.includes(u.id);
                    return (
                      <button key={u.id} onClick={() => setGroupMembers((prev) => selected ? prev.filter((id) => id !== u.id) : [...prev, u.id])}
                        className={cn("w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-[#F3F4F6] last:border-0 text-left", selected ? "bg-[#EEF2F7]" : "hover:bg-[#F8FAFC]")}>
                        <Avatar name={u.fullName} roleId={u.roleId}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A] truncate">{u.fullName}</p>
                          <p className="text-xs text-[#6B7280]">{ROLE_LABEL[u.roleId]}{u.franchiseName ? ` · ${u.franchiseName}` : ""}</p>
                        </div>
                        {selected && <Circle className="w-4 h-4 text-[#2D5DA8] fill-[#2D5DA8] flex-shrink-0"/>}
                      </button>
                    );
                  })}
                </div>
                <div className="px-3 py-3 border-t border-[#E5E7EB]">
                  <button onClick={createGroup} disabled={!groupName.trim() || groupMembers.length === 0}
                    className="w-full py-2.5 rounded-xl bg-[#2D5DA8] text-white font-bold text-sm hover:bg-[#1E4A85] disabled:opacity-40 transition-all">
                    Create Group
                  </button>
                </div>
              </div>
            )}

            {/* ── Chat messages ── */}
            {view === "chat" && activeRoom && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 text-[#2D5DA8] animate-spin"/></div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-[#9CA3AF]">
                      <MessageSquare className="w-8 h-8"/>
                      <p className="text-xs">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={cn("flex gap-2 items-end", msg.isOwn ? "flex-row-reverse" : "flex-row")}>
                        {!msg.isOwn && <Avatar name={msg.senderName} roleId={msg.senderRole} size="sm"/>}
                        <div className={cn("max-w-[75%] flex flex-col gap-0.5", msg.isOwn ? "items-end" : "items-start")}>
                          {!msg.isOwn && <p className="text-[10px] text-[#9CA3AF] px-1">{msg.senderName}</p>}
                          <div className={cn("px-3 py-2 rounded-2xl text-sm leading-relaxed", msg.isOwn ? "bg-[#2D5DA8] text-white rounded-br-sm" : "bg-[#F3F4F6] text-[#1A1A1A] rounded-bl-sm")}>
                            {msg.body}
                          </div>
                          <p className="text-[9px] text-[#9CA3AF] px-1">{timeAgo(msg.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef}/>
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-[#E5E7EB] flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] text-sm focus:outline-none focus:border-[#2D5DA8] transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={!msgText.trim() || sending}
                    className="w-9 h-9 rounded-full bg-[#2D5DA8] text-white flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
