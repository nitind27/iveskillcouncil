"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Plus, Users, Search, Hash, Loader2, X,
  Circle, UserPlus, Settings2, Paperclip, Image as ImageIcon,
  Reply, Edit2, Trash2, Check, CornerUpLeft, FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatUser  { id: string; fullName: string; email: string; roleId: number; franchiseName?: string | null; }
interface ChatMsg   {
  id: string; roomId: string; senderId: string; senderName: string; senderRole: number;
  body: string; msgType: string; fileUrl?: string | null; fileName?: string | null;
  replyToId?: string | null; replyToBody?: string | null; replyToSender?: string | null;
  isEdited: boolean; editedAt?: string | null; isDeleted: boolean;
  createdAt: string; isOwn: boolean;
}
interface ChatRoom  { id: string; type: string; name: string; slug?: string | null; lastMessage?: { body: string; senderName: string; createdAt: string } | null; unreadCount: number; members: { id: string; fullName: string; roleId: number }[]; updatedAt: string; }

const ROLE_LABEL: Record<number, string> = { 1:"Super Admin", 2:"Admin", 3:"Franchise Admin", 4:"Student", 5:"Staff" };
const ROLE_COLOR: Record<number, string> = {
  1: "bg-[#1E4A85]",
  2: "bg-[#C4A35A] text-[#0B132B]",
  3: "bg-[#163A6B]",
  4: "bg-emerald-600",
  5: "bg-violet-600",
};

function timeAgo(iso: string) {
  const d = new Date(iso), diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}
function formatTime(iso: string) { return new Date(iso).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" }); }

function Avatar({ name, roleId, size="md" }: { name:string; roleId:number; size?:"sm"|"md"|"lg" }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const sz = size==="sm"?"w-8 h-8 text-xs":size==="lg"?"w-12 h-12 text-base":"w-10 h-10 text-sm";
  return <div className={cn("rounded-full flex items-center justify-center text-white font-bold flex-shrink-0", sz, ROLE_COLOR[roleId]||"bg-gray-500")}>{initials}</div>;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [rooms,        setRooms]        = useState<ChatRoom[]>([]);
  const [activeRoom,   setActiveRoom]   = useState<ChatRoom | null>(null);
  const [messages,     setMessages]     = useState<ChatMsg[]>([]);
  const [chatUsers,    setChatUsers]    = useState<ChatUser[]>([]);
  const [msgText,      setMsgText]      = useState("");
  const [search,       setSearch]       = useState("");
  const [userSearch,   setUserSearch]   = useState("");
  const [sending,      setSending]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs,  setLoadingMsgs]  = useState(false);
  const [showNewChat,  setShowNewChat]  = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName,    setGroupName]    = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [showMembers,  setShowMembers]  = useState(false);
  const [typingUsers,  setTypingUsers]  = useState<string[]>([]);
  const [replyTo,      setReplyTo]      = useState<ChatMsg | null>(null);
  const [editingMsg,   setEditingMsg]   = useState<ChatMsg | null>(null);
  const [hoveredMsg,   setHoveredMsg]   = useState<string | null>(null);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const sseRef          = useRef<EventSource | null>(null);
  const typingTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef     = useRef(false);

  const roleId  = Number(user?.roleId);
  const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch("/api/chat/rooms", { credentials:"include" });
      const d   = await res.json();
      if (d.success) setRooms(d.data);
    } finally { setLoadingRooms(false); }
  }, []);

  useEffect(() => { loadRooms(); }, [loadRooms]);

  useEffect(() => {
    fetch("/api/chat/users", { credentials:"include" })
      .then(r=>r.json()).then(d=>{ if(d.success) setChatUsers(d.data); });
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, { credentials:"include" });
      const d   = await res.json();
      if (d.success) setMessages(d.data);
    } finally { setLoadingMsgs(false); }
  }, []);

  // SSE with named events
  useEffect(() => {
    if (!activeRoom) return;
    sseRef.current?.close();
    const es = new EventSource(`/api/chat/rooms/${activeRoom.id}/stream`);

    es.addEventListener("message", (e) => {
      try {
        const msg: ChatMsg = JSON.parse(e.data);
        setMessages(prev => prev.find(m=>m.id===msg.id) ? prev : [...prev, msg]);
        setRooms(prev => prev.map(r => r.id===activeRoom.id ? { ...r, lastMessage:{ body:msg.body, senderName:msg.senderName, createdAt:msg.createdAt }, updatedAt:msg.createdAt } : r));
      } catch { /* heartbeat */ }
    });

    es.addEventListener("edited", (e) => {
      try {
        const upd = JSON.parse(e.data);
        setMessages(prev => prev.map(m => m.id===upd.id ? { ...m, body:upd.body, isEdited:upd.isEdited, editedAt:upd.editedAt, isDeleted:upd.isDeleted, msgType:upd.isDeleted?"deleted":m.msgType } : m));
      } catch { /* ignore */ }
    });

    es.addEventListener("typing", (e) => {
      try { setTypingUsers(JSON.parse(e.data)); } catch { /* ignore */ }
    });

    sseRef.current = es;
    return () => { es.close(); sseRef.current = null; };
  }, [activeRoom]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typingUsers]);

  // Typing indicator
  const sendTyping = useCallback(async (typing: boolean) => {
    if (!activeRoom) return;
    await fetch(`/api/chat/rooms/${activeRoom.id}/typing`, {
      method:"POST", credentials:"include",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ typing }),
    });
  }, [activeRoom]);

  const handleInputChange = (val: string) => {
    setMsgText(val);
    if (!isTypingRef.current) { isTypingRef.current = true; sendTyping(true); }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => { isTypingRef.current = false; sendTyping(false); }, 2000);
  };

  const openRoom = async (room: ChatRoom) => {
    setActiveRoom(room); setShowNewChat(false); setShowNewGroup(false); setShowMembers(false);
    setReplyTo(null); setEditingMsg(null); setMsgText("");
    await loadMessages(room.id);
    setTimeout(() => inputRef.current?.focus(), 100);
    setRooms(prev => prev.map(r => r.id===room.id ? { ...r, unreadCount:0 } : r));
  };

  const startDirect = async (u: ChatUser) => {
    const res = await fetch("/api/chat/rooms", {
      method:"POST", credentials:"include",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"direct", targetUserId:u.id }),
    });
    const d = await res.json();
    if (d.success) {
      const room: ChatRoom = { id:d.data.id, type:"direct", name:u.fullName, slug:d.data.slug, lastMessage:null, unreadCount:0, members:[{ id:u.id, fullName:u.fullName, roleId:u.roleId }], updatedAt:new Date().toISOString() };
      setRooms(prev => [room, ...prev.filter(r=>r.id!==room.id)]);
      openRoom(room);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupMembers.length===0) return;
    const res = await fetch("/api/chat/rooms", {
      method:"POST", credentials:"include",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"group", name:groupName, memberIds:groupMembers }),
    });
    const d = await res.json();
    if (d.success) {
      const room: ChatRoom = { id:d.data.id, type:"group", name:groupName, lastMessage:null, unreadCount:0, members:[], updatedAt:new Date().toISOString() };
      setRooms(prev => [room, ...prev]);
      setGroupName(""); setGroupMembers([]); setShowNewGroup(false);
      openRoom(room);
    }
  };

  const sendMessage = async () => {
    if (editingMsg) { await saveEdit(); return; }
    if (!msgText.trim() || !activeRoom || sending) return;
    const text = msgText.trim(); setMsgText(""); setSending(true);
    isTypingRef.current = false; sendTyping(false);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text, replyToId:replyTo?.id }),
      });
      const d = await res.json();
      if (d.success) setMessages(prev => prev.find(m=>m.id===d.data.id) ? prev : [...prev, d.data]);
      setReplyTo(null);
    } finally { setSending(false); }
  };

  const saveEdit = async () => {
    if (!editingMsg || !msgText.trim() || !activeRoom) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
        method:"PATCH", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messageId:editingMsg.id, newText:msgText.trim() }),
      });
      const d = await res.json();
      if (d.success) setMessages(prev => prev.map(m => m.id===d.data.id ? d.data : m));
      setEditingMsg(null); setMsgText("");
    } finally { setSending(false); }
  };

  const deleteMessage = async (msg: ChatMsg) => {
    if (!activeRoom) return;
    const res = await fetch(`/api/chat/rooms/${activeRoom.id}/messages?messageId=${msg.id}`, {
      method:"DELETE", credentials:"include",
    });
    const d = await res.json();
    if (d.success) setMessages(prev => prev.map(m => m.id===msg.id ? { ...m, isDeleted:true, body:"This message was deleted", msgType:"deleted" } : m));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || !activeRoom) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append("files", f));
      const res  = await fetch("/api/chat/upload", { method:"POST", body:form, credentials:"include" });
      const data = await res.json();
      if (!data.success) return;
      for (const f of data.data) {
        const msgRes = await fetch(`/api/chat/rooms/${activeRoom.id}/messages`, {
          method:"POST", credentials:"include",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ text:f.name, msgType:f.msgType, fileUrl:f.url, fileName:f.name, replyToId:replyTo?.id }),
        });
        const msgData = await msgRes.json();
        if (msgData.success) setMessages(prev => prev.find(m=>m.id===msgData.data.id) ? prev : [...prev, msgData.data]);
      }
      setReplyTo(null);
    } finally { setUploading(false); }
  };

  const startEdit = (msg: ChatMsg) => {
    setEditingMsg(msg); setMsgText(msg.body); setReplyTo(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setEditingMsg(null); setMsgText(""); };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = chatUsers.filter(u =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.franchiseName||"").toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalUnread = rooms.reduce((s,r) => s+r.unreadCount, 0);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Chat</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Messages</h1>
              {totalUnread > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#C4A35A] px-2 text-[11px] font-bold text-[#0B132B]">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">
              Direct messages & group discussions across your network
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                Conversations
              </p>
              <p className="font-bold tabular-nums">{rooms.length}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowNewChat(true);
                setShowNewGroup(false);
                setUserSearch("");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-220px)] min-h-[520px] overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">

        {/* ── Sidebar ── */}
        <div className="flex w-72 shrink-0 flex-col border-r border-[#1E4A85]/10 bg-gradient-to-b from-[#1E4A85]/[0.04] to-transparent">
          <div className="flex items-center justify-between border-b border-[#1E4A85]/10 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
              Inbox
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setShowNewChat(true);
                  setShowNewGroup(false);
                  setUserSearch("");
                }}
                title="New chat"
                className="rounded-lg p-1.5 text-[#1E4A85] transition hover:bg-[#1E4A85]/10"
              >
                <Plus className="h-4 w-4" />
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewGroup(true);
                    setShowNewChat(false);
                    setUserSearch("");
                    setGroupName("");
                    setGroupMembers([]);
                  }}
                  title="New group"
                  className="rounded-lg p-1.5 text-[#1E4A85] transition hover:bg-[#1E4A85]/10"
                >
                  <Users className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="border-b border-[#1E4A85]/10 px-3 py-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-xl border border-border/70 bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-[#1E4A85]" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-muted-foreground">
                <MessageSquare className="h-8 w-8 text-[#1E4A85]/40" />
                <p className="text-xs font-medium">No conversations yet</p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => openRoom(room)}
                  className={cn(
                    "relative flex w-full items-center gap-3 border-b border-[#1E4A85]/5 px-4 py-3 text-left transition",
                    activeRoom?.id === room.id
                      ? "bg-[#1E4A85]/10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#C4A35A]"
                      : "hover:bg-[#1E4A85]/[0.05]"
                  )}
                >
                  <div className="relative shrink-0">
                    {room.type === "group" ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4A35A] to-[#A8893E] shadow-sm">
                        <Hash className="h-4 w-4 text-[#0B132B]" />
                      </div>
                    ) : (
                      <Avatar name={room.name} roleId={room.members[0]?.roleId ?? 3} size="sm" />
                    )}
                    {room.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C4A35A] px-0.5 text-[9px] font-bold text-[#0B132B]">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "truncate text-xs font-semibold",
                          room.unreadCount > 0 ? "text-foreground" : "text-foreground/80"
                        )}
                      >
                        {room.name}
                      </p>
                      {room.lastMessage && (
                        <span className="shrink-0 text-[9px] text-muted-foreground">
                          {timeAgo(room.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {room.lastMessage ? (
                      <p className="truncate text-[10px] text-muted-foreground">
                        {room.lastMessage.senderName}: {room.lastMessage.body}
                      </p>
                    ) : (
                      <p className="text-[10px] italic text-muted-foreground">No messages yet</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="relative flex flex-1 flex-col overflow-hidden">

          {/* New chat / group overlay */}
          <AnimatePresence>
            {(showNewChat || showNewGroup) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute inset-0 z-10 flex flex-col bg-background"
              >
                <div className="flex items-center justify-between border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.06] to-transparent px-5 py-4">
                  <h3 className="font-bold text-[#1E4A85]">
                    {showNewGroup ? "Create group chat" : "New direct message"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewChat(false);
                      setShowNewGroup(false);
                    }}
                    className="rounded-lg p-1.5 hover:bg-[#1E4A85]/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {showNewGroup && (
                  <div className="space-y-2 border-b border-[#1E4A85]/10 px-5 py-3">
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name…"
                      className="w-full rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                    />
                    {groupMembers.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                  </div>
                )}
                <div className="border-b border-[#1E4A85]/10 px-5 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      autoFocus
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search people…"
                      className="w-full rounded-xl border border-border/70 bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredUsers.map((u) => {
                    const sel = groupMembers.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() =>
                          showNewGroup
                            ? setGroupMembers((prev) =>
                                sel ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                              )
                            : startDirect(u)
                        }
                        className={cn(
                          "flex w-full items-center gap-4 border-b border-[#1E4A85]/5 px-5 py-3.5 text-left transition last:border-0",
                          sel ? "bg-[#1E4A85]/10" : "hover:bg-[#1E4A85]/[0.05]"
                        )}
                      >
                        <Avatar name={u.fullName} roleId={u.roleId} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABEL[u.roleId]}
                            {u.franchiseName ? ` · ${u.franchiseName}` : ""}
                          </p>
                        </div>
                        {showNewGroup && sel && (
                          <Circle className="h-5 w-5 shrink-0 fill-[#1E4A85] text-[#1E4A85]" />
                        )}
                      </button>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">No users found</p>
                  )}
                </div>
                {showNewGroup && (
                  <div className="border-t border-[#1E4A85]/10 px-5 py-4">
                    <button
                      type="button"
                      onClick={createGroup}
                      disabled={!groupName.trim() || groupMembers.length === 0}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E4A85] py-3 text-sm font-bold text-white transition hover:bg-[#163A6B] disabled:opacity-40"
                    >
                      <Users className="h-4 w-4" />
                      Create group ({groupMembers.length} members)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!activeRoom ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#1E4A85]/15 to-[#C4A35A]/15">
                <MessageSquare className="h-10 w-10 text-[#1E4A85]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Select a conversation</p>
                <p className="mt-1 text-sm">Choose from the list or start a new chat</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewChat(true);
                  setUserSearch("");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163A6B]"
              >
                <Plus className="h-4 w-4" />
                New chat
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex shrink-0 items-center justify-between border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {activeRoom.type === "group" ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4A35A] to-[#A8893E] shadow-sm">
                      <Hash className="h-5 w-5 text-[#0B132B]" />
                    </div>
                  ) : (
                    <Avatar
                      name={activeRoom.name}
                      roleId={activeRoom.members[0]?.roleId ?? 3}
                      size="md"
                    />
                  )}
                  <div>
                    <p className="font-bold text-foreground">{activeRoom.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeRoom.type === "group"
                        ? `Group · ${activeRoom.members.length + 1} members`
                        : ROLE_LABEL[activeRoom.members[0]?.roleId ?? 3] ?? ""}
                    </p>
                  </div>
                </div>
                {activeRoom.type === "group" && isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowMembers((s) => !s)}
                    className="rounded-xl p-2 text-muted-foreground transition hover:bg-[#1E4A85]/10 hover:text-[#1E4A85]"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-1 overflow-y-auto bg-gradient-to-b from-[#1E4A85]/[0.02] to-transparent px-4 py-4">
                {loadingMsgs ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1E4A85]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 text-[#1E4A85]/40" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const showDate =
                      i === 0 ||
                      new Date(messages[i - 1].createdAt).toDateString() !==
                        new Date(msg.createdAt).toDateString();
                    const isDeleted = msg.isDeleted || msg.msgType === "deleted";
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-[#1E4A85]/10" />
                            <span className="px-2 text-[10px] font-medium text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <div className="h-px flex-1 bg-[#1E4A85]/10" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "group flex items-end gap-2 py-0.5",
                            msg.isOwn ? "flex-row-reverse" : "flex-row"
                          )}
                          onMouseEnter={() => setHoveredMsg(msg.id)}
                          onMouseLeave={() => setHoveredMsg(null)}
                        >
                          {!msg.isOwn && (
                            <Avatar name={msg.senderName} roleId={msg.senderRole} size="sm" />
                          )}
                          <div
                            className={cn(
                              "flex max-w-[65%] flex-col gap-0.5",
                              msg.isOwn ? "items-end" : "items-start"
                            )}
                          >
                            {!msg.isOwn && (
                              <p className="px-1 text-[10px] font-medium text-muted-foreground">
                                {msg.senderName}
                              </p>
                            )}

                            {msg.replyToId && !isDeleted && (
                              <div
                                className={cn(
                                  "mb-0.5 max-w-full rounded-xl border-l-2 border-[#C4A35A] bg-[#1E4A85]/5 px-3 py-1.5 text-xs",
                                  msg.isOwn ? "text-right" : "text-left"
                                )}
                              >
                                <p className="text-[10px] font-semibold text-[#1E4A85]">
                                  {msg.replyToSender}
                                </p>
                                <p className="truncate text-muted-foreground">{msg.replyToBody}</p>
                              </div>
                            )}

                            <div
                              className={cn(
                                "relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                                isDeleted
                                  ? "bg-muted text-xs italic text-muted-foreground"
                                  : msg.isOwn
                                    ? "rounded-br-sm bg-[#1E4A85] text-white"
                                    : "rounded-bl-sm border border-[#1E4A85]/10 bg-white text-foreground dark:bg-muted"
                              )}
                            >
                              {msg.msgType === "image" && msg.fileUrl && !isDeleted && (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={msg.fileUrl}
                                    alt={msg.fileName || "image"}
                                    className="mb-1 max-h-[200px] max-w-[220px] cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
                                  />
                                </a>
                              )}
                              {msg.msgType === "file" && msg.fileUrl && !isDeleted && (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 transition-opacity hover:opacity-80"
                                >
                                  <FileText className="h-5 w-5 shrink-0" />
                                  <span className="text-xs underline underline-offset-2">
                                    {msg.fileName || msg.body}
                                  </span>
                                </a>
                              )}
                              {(msg.msgType === "text" || msg.msgType === "deleted") && (
                                <span>{msg.body}</span>
                              )}
                            </div>

                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-1",
                                msg.isOwn ? "flex-row-reverse" : "flex-row"
                              )}
                            >
                              <p className="text-[9px] text-muted-foreground">
                                {formatTime(msg.createdAt)}
                              </p>
                              {msg.isEdited && !isDeleted && (
                                <span className="text-[9px] italic text-muted-foreground">
                                  edited
                                </span>
                              )}
                            </div>
                          </div>

                          {hoveredMsg === msg.id && !isDeleted && (
                            <div
                              className={cn(
                                "flex items-center gap-0.5 self-center",
                                msg.isOwn ? "mr-1" : "ml-1"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => setReplyTo(msg)}
                                title="Reply"
                                className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground shadow-sm transition hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
                              >
                                <Reply className="h-3.5 w-3.5" />
                              </button>
                              {msg.isOwn && msg.msgType === "text" && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(msg)}
                                  title="Edit"
                                  className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground shadow-sm transition hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {msg.isOwn && (
                                <button
                                  type="button"
                                  onClick={() => deleteMessage(msg)}
                                  title="Delete"
                                  className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground shadow-sm transition hover:bg-red-50 hover:text-red-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {typingUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-2 py-1"
                  >
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-[#1E4A85]/10 px-3 py-2">
                      <span className="text-xs text-muted-foreground">
                        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
                      </span>
                      <span className="ml-1 flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            className="inline-block h-1 w-1 rounded-full bg-[#1E4A85]/60"
                          />
                        ))}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply / Edit banner */}
              <AnimatePresence>
                {(replyTo || editingMsg) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex shrink-0 items-center justify-between gap-3 border-t border-[#1E4A85]/10 bg-[#1E4A85]/[0.04] px-4 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {replyTo && (
                        <>
                          <CornerUpLeft className="h-4 w-4 shrink-0 text-[#1E4A85]" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[#1E4A85]">
                              {replyTo.senderName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{replyTo.body}</p>
                          </div>
                        </>
                      )}
                      {editingMsg && (
                        <>
                          <Edit2 className="h-4 w-4 shrink-0 text-[#C4A35A]" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-[#C4A35A]">Editing message</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {editingMsg.body}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        cancelEdit();
                      }}
                      className="shrink-0 rounded-lg p-1 hover:bg-[#1E4A85]/10"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <div className="flex shrink-0 items-center gap-2 border-t border-[#1E4A85]/10 bg-background px-3 py-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  className="hidden"
                  onChange={(e) => uploadFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach files"
                  className="shrink-0 rounded-xl p-2.5 text-muted-foreground transition hover:bg-[#1E4A85]/10 hover:text-[#1E4A85] disabled:opacity-40"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                      fileInputRef.current.accept =
                        "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip";
                    }
                  }}
                  title="Send image"
                  className="shrink-0 rounded-xl p-2.5 text-muted-foreground transition hover:bg-[#1E4A85]/10 hover:text-[#1E4A85]"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>

                <input
                  ref={inputRef}
                  value={msgText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                    if (e.key === "Escape") {
                      cancelEdit();
                      setReplyTo(null);
                    }
                  }}
                  placeholder={
                    editingMsg
                      ? "Edit message…"
                      : replyTo
                        ? `Reply to ${replyTo.senderName}…`
                        : `Message ${activeRoom.name}…`
                  }
                  className="flex-1 rounded-2xl border border-border/70 bg-muted/50 px-4 py-2.5 text-sm outline-none transition focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                />

                {editingMsg ? (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl p-2.5 text-muted-foreground transition hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={saveEdit}
                      disabled={!msgText.trim() || sending}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C4A35A] text-[#0B132B] shadow-md disabled:opacity-40"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={sendMessage}
                    disabled={!msgText.trim() || sending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E4A85] text-white shadow-md disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Group members panel ── */}
        <AnimatePresence>
          {showMembers && activeRoom?.type === "group" && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex flex-col overflow-hidden border-l border-[#1E4A85]/10 bg-gradient-to-b from-[#1E4A85]/[0.04] to-transparent"
            >
              <div className="flex items-center justify-between border-b border-[#1E4A85]/10 px-4 py-3">
                <span className="text-sm font-bold text-[#1E4A85]">Members</span>
                <button
                  type="button"
                  onClick={() => setShowMembers(false)}
                  className="rounded-lg p-1 hover:bg-[#1E4A85]/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                <div className="flex items-center gap-2 rounded-xl bg-[#1E4A85]/10 p-2">
                  <Avatar name={user?.fullName ?? "Me"} roleId={roleId} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {user?.fullName} (You)
                    </p>
                    <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[roleId]}</p>
                  </div>
                </div>
                {activeRoom.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-[#1E4A85]/[0.05]"
                  >
                    <Avatar name={m.fullName} roleId={m.roleId} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{m.fullName}</p>
                      <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[m.roleId]}</p>
                    </div>
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="border-t border-[#1E4A85]/10 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewChat(true);
                      setShowMembers(false);
                      setUserSearch("");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1E4A85]/40 py-2 text-xs font-semibold text-[#1E4A85] transition hover:bg-[#1E4A85]/5"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add member
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
