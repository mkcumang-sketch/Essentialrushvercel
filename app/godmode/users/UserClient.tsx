
"use client";

import { useState, useTransition, useMemo } from "react";
import { Trash2, RefreshCw, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [listVersion, setListVersion] = useState(Date.now()); // 🚀 DOM Nuke Key
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    try {
      const r = await fetch(`/api/Godmode/users?t=${Date.now()}`, { 
          cache: "no-store",
          headers: { 'Cache-Control': 'no-cache' }
      });
      const j = await r.json();
      if (j?.success && j.users) setUsers(j.users);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, query]);

  const onDelete = (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/Godmode/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (data.success) {
          notify("VIP Record Purged", "success");
          await fetchUsers(); 
          setListVersion(Date.now()); // 🚀 DOM NUKE
        } else {
          notify("Failed to delete.", "error");
        }
      } catch (error) {
        notify("Network error.", "error");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-8 left-1/2 z-[200] border text-white px-6 py-4 rounded-full flex items-center gap-4 shadow-2xl backdrop-blur-md ${toast.type === 'success' ? 'bg-[#0A0A0A] border-[#D4AF37]/30' : 'bg-red-950 border-red-500/30'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-[#D4AF37]" /> : <AlertCircle size={18} className="text-red-500" />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-[#D4AF37] rounded-xl flex items-center justify-center font-bold">♞</div>
          <h1 className="text-2xl font-serif font-black tracking-tight">VIP Clients</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full md:w-auto bg-white border border-gray-200 rounded-full pl-9 pr-4 py-3 text-xs font-bold outline-none focus:border-[#D4AF37] transition-all shadow-sm" placeholder="Search clients..." />
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div key={listVersion} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.length > 0 ? filtered.map((user) => (
            <motion.div key={user._id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-gray-200 transition-all flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center font-serif italic font-black text-xl border border-gray-100 flex-shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'V'}
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-1">{user.role || "Member"}</div>
                  <div className="text-lg font-serif font-black tracking-tight leading-tight">{user.name || "Anonymous VIP"}</div>
                  <div className="text-xs text-gray-500 mt-1 font-bold">{user.email || "—"}</div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-50">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(user._id)} disabled={isPending && deletingId === user._id}
                  className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-200 hover:bg-black hover:text-[#D4AF37] hover:border-black transition-colors flex items-center justify-center disabled:opacity-50">
                  {isPending && deletingId === user._id ? <RefreshCw size={16} className="animate-spin text-gray-400" /> : <Trash2 size={16} />}
                </motion.button>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
               <h3 className="text-2xl font-serif italic text-gray-400 mb-2">No Clients Found</h3>
            </div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
}