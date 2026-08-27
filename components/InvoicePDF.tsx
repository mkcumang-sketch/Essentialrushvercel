"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Loader2, Mail } from "lucide-react";

interface InvoicePDFProps {
  order: {
    orderId: string;
    items: Array<{ name?: string; qty?: number; price?: number }>;
    totalAmount: number;
    shippingData?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    createdAt?: string;
    status?: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
}

export default function InvoicePDF({ order, user }: InvoicePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/email/invoice?orderId=${order.orderId}`);
      const html = await response.text();

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${order.orderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailInvoice = async () => {
    setIsSending(true);
    try {
      const response = await fetch("/api/email/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Invoice sent to your email!");
      }
    } catch (error) {
      console.error("Email failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadPDF}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        Download Invoice
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleEmailInvoice}
        disabled={isSending}
        className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 hover:border-[#D4AF37] text-gray-600 hover:text-[#D4AF37] rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {isSending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Mail size={16} />
        )}
        Email Invoice
      </motion.button>
    </div>
  );
}