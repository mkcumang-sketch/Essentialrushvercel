"use client";
import { useEffect } from "react";

export default function RecentTracker({ watch }: { watch: any }) {
  useEffect(() => {
    // Browser ki memory se purani watches nikalo
    const stored = JSON.parse(localStorage.getItem("essential_recent") || "[]");
    
    // Agar ye watch pehle se hai, toh usko hatao taaki wapas no. 1 pe aa sake
    const filtered = stored.filter((item: any) => item._id !== watch._id);
    
    // Nayi watch ko sabse aage (top) par jodo
    filtered.unshift(watch);
    
    // Sirf top 4 watches hi save rakho
    const finalRecent = filtered.slice(0, 4);
    localStorage.setItem("essential_recent", JSON.stringify(finalRecent));
  }, [watch]);

  return null; // Ye screen par kuch nahi dikhayega, sirf background mein kaam karega
}