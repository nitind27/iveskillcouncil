"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Send, Plus, Users, Search, Hash, Loader2, X,
  Circle, UserPlus, Settings2, Paperclip, Image as ImageIcon,
  Reply, Edit2, Trash2, Check, CornerUpLeft, FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import Breadcrumb from "@/components/common/Breadcrumb";
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
const ROLE_COLOR: Record<number, string> = { 1:"bg-[#2D5DA8]", 2:"bg-[#A8C63A]", 3:"bg-[#F39C12]", 4:"bg-emerald-500", 5:"bg-violet-500" };

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
    <div className="space-y-4">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Chat" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary"/> Chat
            {totalUnread>0 && <span className="ml-1 px-2 py-0.5 rounded-full bg-[#F39C12] text-white text-xs font-black">{totalUnread}</span>}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Direct messages and group discussions</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)] min-h-[520px] rounded-2xl border border-border overflow-hidden bg-background shadow-sm">

        {/* ── Sidebar ── */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-muted/20">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-bold text-foreground text-sm">Conversations</span>
            <div className="flex gap-1">
              <button onClick={() => { setShowNewChat(true); setShowNewGroup(false); setUserSearch(""); }} title="New chat" className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Plus className="w-4 h-4"/></button>
              {isAdmin && <button onClick={() => { setShowNewGroup(true); setShowNewChat(false); setUserSearch(""); setGroupName(""); setGroupMembers([]); }} title="New group" className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Users className="w-4 h-4"/></button>}
            </div>
          </div>
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chats..." className="w-full pl-8 pr-3 py-2 rounded-xl bg-background border border-input text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-primary animate-spin"/></div>
            ) : filteredRooms.length===0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground"><MessageSquare className="w-8 h-8"/><p className="text-xs">No conversations yet</p></div>
            ) : filteredRooms.map(room => (
              <button key={room.id} onClick={() => openRoom(room)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-border/50 last:border-0 text-left", activeRoom?.id===room.id ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/50")}>
                <div className="relative flex-shrink-0">
                  {room.type==="group" ? <div className="w-9 h-9 rounded-full bg-[#A8C63A] flex items-center justify-center"><Hash className="w-4 h-4 text-white"/></div> : <Avatar name={room.name} roleId={room.members[0]?.roleId??3} size="sm"/>}
                  {room.unreadCount>0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F39C12] text-white text-[9px] font-black flex items-center justify-center">{room.unreadCount}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn("text-xs font-semibold truncate", room.unreadCount>0?"text-foreground":"text-foreground/80")}>{room.name}</p>
                    {room.lastMessage && <span className="text-[9px] text-muted-foreground flex-shrink-0">{timeAgo(room.lastMessage.createdAt)}</span>}
                  </div>
                  {room.lastMessage ? <p className="text-[10px] text-muted-foreground truncate">{room.lastMessage.senderName}: {room.lastMessage.body}</p> : <p className="text-[10px] text-muted-foreground italic">No messages yet</p>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* New chat / group overlay */}
          <AnimatePresence>
            {(showNewChat||showNewGroup) && (
              <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="absolute inset-0 z-10 bg-background flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground">{showNewGroup?"Create Group Chat":"New Direct Message"}</h3>
                  <button onClick={() => { setShowNewChat(false); setShowNewGroup(false); }} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4"/></button>
                </div>
                {showNewGroup && (
                  <div className="px-5 py-3 border-b border-border space-y-2">
                    <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="Group name..." className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"/>
                    {groupMembers.length>0 && <p className="text-xs text-muted-foreground">{groupMembers.length} member{groupMembers.length!==1?"s":""} selected</p>}
                  </div>
                )}
                <div className="px-5 py-3 border-b border-border">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <input autoFocus value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search people..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"/>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredUsers.map(u => {
                    const sel = groupMembers.includes(u.id);
                    return (
                      <button key={u.id} onClick={() => showNewGroup ? setGroupMembers(prev=>sel?prev.filter(id=>id!==u.id):[...prev,u.id]) : startDirect(u)}
                        className={cn("w-full flex items-center gap-4 px-5 py-3.5 transition-colors border-b border-border/50 last:border-0 text-left", sel?"bg-primary/10":"hover:bg-muted/50")}>
                        <Avatar name={u.fullName} roleId={u.roleId} size="md"/>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{ROLE_LABEL[u.roleId]}{u.franchiseName?` · ${u.franchiseName}`:""}</p>
                        </div>
                        {showNewGroup && sel && <Circle className="w-5 h-5 text-primary fill-primary flex-shrink-0"/>}
                      </button>
                    );
                  })}
                  {filteredUsers.length===0 && <p className="text-center text-sm text-muted-foreground py-10">No users found</p>}
                </div>
                {showNewGroup && (
                  <div className="px-5 py-4 border-t border-border">
                    <button onClick={createGroup} disabled={!groupName.trim()||groupMembers.length===0} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                      <Users className="w-4 h-4"/> Create Group ({groupMembers.length} members)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!activeRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center"><MessageSquare className="w-10 h-10"/></div>
              <div className="text-center"><p className="font-semibold text-foreground">Select a conversation</p><p className="text-sm mt-1">Choose from the list or start a new chat</p></div>
              <button onClick={() => { setShowNewChat(true); setUserSearch(""); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"><Plus className="w-4 h-4"/> New Chat</button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background flex-shrink-0">
                <div className="flex items-center gap-3">
                  {activeRoom.type==="group" ? <div className="w-10 h-10 rounded-full bg-[#A8C63A] flex items-center justify-center"><Hash className="w-5 h-5 text-white"/></div> : <Avatar name={activeRoom.name} roleId={activeRoom.members[0]?.roleId??3} size="md"/>}
                  <div>
                    <p className="font-bold text-foreground">{activeRoom.name}</p>
                    <p className="text-xs text-muted-foreground">{activeRoom.type==="group"?`Group · ${activeRoom.members.length+1} members`:ROLE_LABEL[activeRoom.members[0]?.roleId??3]??""}</p>
                  </div>
                </div>
                {activeRoom.type==="group" && isAdmin && (
                  <button onClick={() => setShowMembers(s=>!s)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Settings2 className="w-4 h-4"/></button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-primary animate-spin"/></div>
                ) : messages.length===0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground"><MessageSquare className="w-10 h-10"/><p className="text-sm">No messages yet. Start the conversation!</p></div>
                ) : messages.map((msg, i) => {
                  const showDate = i===0 || new Date(messages[i-1].createdAt).toDateString()!==new Date(msg.createdAt).toDateString();
                  const isDeleted = msg.isDeleted || msg.msgType==="deleted";
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-border"/>
                          <span className="text-[10px] text-muted-foreground font-medium px-2">{new Date(msg.createdAt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                          <div className="flex-1 h-px bg-border"/>
                        </div>
                      )}
                      <div className={cn("group flex gap-2 items-end py-0.5", msg.isOwn?"flex-row-reverse":"flex-row")}
                        onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)}>
                        {!msg.isOwn && <Avatar name={msg.senderName} roleId={msg.senderRole} size="sm"/>}
                        <div className={cn("max-w-[65%] flex flex-col gap-0.5", msg.isOwn?"items-end":"items-start")}>
                          {!msg.isOwn && <p className="text-[10px] text-muted-foreground px-1 font-medium">{msg.senderName}</p>}

                          {/* Reply preview */}
                          {msg.replyToId && !isDeleted && (
                            <div className={cn("px-3 py-1.5 rounded-xl text-xs border-l-2 border-primary/50 bg-muted/60 mb-0.5 max-w-full", msg.isOwn?"text-right":"text-left")}>
                              <p className="font-semibold text-primary text-[10px]">{msg.replyToSender}</p>
                              <p className="text-muted-foreground truncate">{msg.replyToBody}</p>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm relative",
                            isDeleted ? "bg-muted text-muted-foreground italic text-xs" :
                            msg.isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                            {/* Image */}
                            {msg.msgType==="image" && msg.fileUrl && !isDeleted && (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img src={msg.fileUrl} alt={msg.fileName||"image"} className="max-w-[220px] max-h-[200px] rounded-xl object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity"/>
                              </a>
                            )}
                            {/* File */}
                            {msg.msgType==="file" && msg.fileUrl && !isDeleted && (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <FileText className="w-5 h-5 flex-shrink-0"/>
                                <span className="underline underline-offset-2 text-xs">{msg.fileName||msg.body}</span>
                              </a>
                            )}
                            {/* Text */}
                            {(msg.msgType==="text"||msg.msgType==="deleted") && <span>{msg.body}</span>}
                          </div>

                          {/* Meta */}
                          <div className={cn("flex items-center gap-1.5 px-1", msg.isOwn?"flex-row-reverse":"flex-row")}>
                            <p className="text-[9px] text-muted-foreground">{formatTime(msg.createdAt)}</p>
                            {msg.isEdited && !isDeleted && <span className="text-[9px] text-muted-foreground italic">edited</span>}
                          </div>
                        </div>

                        {/* Action buttons on hover */}
                        {hoveredMsg===msg.id && !isDeleted && (
                          <div className={cn("flex items-center gap-0.5 self-center", msg.isOwn?"mr-1":"ml-1")}>
                            <button onClick={() => setReplyTo(msg)} title="Reply" className="p-1.5 rounded-lg bg-background border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                              <Reply className="w-3.5 h-3.5"/>
                            </button>
                            {msg.isOwn && msg.msgType==="text" && (
                              <button onClick={() => startEdit(msg)} title="Edit" className="p-1.5 rounded-lg bg-background border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-sm">
                                <Edit2 className="w-3.5 h-3.5"/>
                              </button>
                            )}
                            {msg.isOwn && (
                              <button onClick={() => deleteMessage(msg)} title="Delete" className="p-1.5 rounded-lg bg-background border border-border hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500 shadow-sm">
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.length>0 && (
                  <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} className="flex items-center gap-2 px-2 py-1">
                    <div className="flex gap-1 items-center px-3 py-2 rounded-2xl bg-muted rounded-bl-sm">
                      <span className="text-xs text-muted-foreground">{typingUsers.join(", ")} {typingUsers.length===1?"is":"are"} typing</span>
                      <span className="flex gap-0.5 ml-1">
                        {[0,1,2].map(i => <motion.span key={i} animate={{y:[0,-3,0]}} transition={{duration:0.6,repeat:Infinity,delay:i*0.15}} className="w-1 h-1 rounded-full bg-muted-foreground inline-block"/>)}
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef}/>
              </div>

              {/* Reply / Edit banner */}
              <AnimatePresence>
                {(replyTo||editingMsg) && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                    className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {replyTo && <><CornerUpLeft className="w-4 h-4 text-primary flex-shrink-0"/>
                        <div className="min-w-0"><p className="text-[10px] font-bold text-primary">{replyTo.senderName}</p><p className="text-xs text-muted-foreground truncate">{replyTo.body}</p></div></>}
                      {editingMsg && <><Edit2 className="w-4 h-4 text-amber-500 flex-shrink-0"/>
                        <div className="min-w-0"><p className="text-[10px] font-bold text-amber-500">Editing message</p><p className="text-xs text-muted-foreground truncate">{editingMsg.body}</p></div></>}
                    </div>
                    <button onClick={() => { setReplyTo(null); cancelEdit(); }} className="p-1 rounded-lg hover:bg-muted flex-shrink-0"><X className="w-4 h-4 text-muted-foreground"/></button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <div className="px-3 py-3 border-t border-border bg-background flex items-center gap-2 flex-shrink-0">
                {/* File upload */}
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" className="hidden" onChange={e => uploadFiles(e.target.files)}/>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach files"
                  className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-40">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Paperclip className="w-4 h-4"/>}
                </button>
                <button onClick={() => { if(fileInputRef.current){ fileInputRef.current.accept="image/*"; fileInputRef.current.click(); fileInputRef.current.accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"; }}} title="Send image"
                  className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
                  <ImageIcon className="w-4 h-4"/>
                </button>

                <input ref={inputRef} value={msgText} onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); } if(e.key==="Escape"){ cancelEdit(); setReplyTo(null); }}}
                  placeholder={editingMsg?"Edit message...":replyTo?`Reply to ${replyTo.senderName}...`:`Message ${activeRoom.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-muted border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"/>

                {editingMsg ? (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={cancelEdit} className="p-2.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground"><X className="w-4 h-4"/></button>
                    <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.95}} onClick={saveEdit} disabled={!msgText.trim()||sending}
                      className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center disabled:opacity-40 shadow-md">
                      {sending?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}
                    </motion.button>
                  </div>
                ) : (
                  <motion.button whileHover={{scale:1.08}} whileTap={{scale:0.95}} onClick={sendMessage} disabled={!msgText.trim()||sending}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shadow-md flex-shrink-0">
                    {sending?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Group members panel ── */}
        <AnimatePresence>
          {showMembers && activeRoom?.type==="group" && (
            <motion.div initial={{width:0,opacity:0}} animate={{width:240,opacity:1}} exit={{width:0,opacity:0}} className="border-l border-border flex flex-col overflow-hidden bg-background">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-bold text-foreground text-sm">Members</span>
                <button onClick={() => setShowMembers(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
                  <Avatar name={user?.fullName??"Me"} roleId={roleId} size="sm"/>
                  <div className="min-w-0"><p className="text-xs font-semibold text-foreground truncate">{user?.fullName} (You)</p><p className="text-[10px] text-muted-foreground">{ROLE_LABEL[roleId]}</p></div>
                </div>
                {activeRoom.members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <Avatar name={m.fullName} roleId={m.roleId} size="sm"/>
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-foreground truncate">{m.fullName}</p><p className="text-[10px] text-muted-foreground">{ROLE_LABEL[m.roleId]}</p></div>
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="p-3 border-t border-border">
                  <button onClick={() => { setShowNewChat(true); setShowMembers(false); setUserSearch(""); }} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-semibold hover:bg-primary/05 transition-colors">
                    <UserPlus className="w-3.5 h-3.5"/> Add Member
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
