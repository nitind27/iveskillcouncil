"use client";

import { motion } from "framer-motion";
import { GlassModal } from "@/components/common/GlassModal";
import type { OfferItem } from "@/config/userpanel.config";

interface OfferModalProps {
  offer: OfferItem | null;
  onClose: () => void;
  onApplyNow?: (offer: OfferItem) => void;
}

export default function OfferModal({ offer, onClose, onApplyNow }: OfferModalProps) {
  return (
    <GlassModal
      open={!!offer}
      onClose={onClose}
      title=""
      size="sm"
      showCloseButton
      backdropClassName="bg-black/40 backdrop-blur-xl"
      contentClassName="!bg-white border-gray-200"
    >
      {offer && (
        <div className="text-center pt-2">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1, stiffness: 300 }}
            className="inline-block rounded-2xl bg-[#C4A35A] px-6 py-3 text-lg font-bold text-[#1A1408] mb-6 shadow-[0_0_16px_rgba(196,163,90,0.4)]"
          >
            {offer.discount}% OFF
          </motion.span>
          <h3 className="text-2xl font-bold text-[#0F172A] mb-3">{offer.title}</h3>
          <p className="text-[#64748B] mb-6 leading-relaxed">{offer.description}</p>
          {offer.validUntil && (
            <p className="text-sm text-[#94A3B8] mb-4">Valid until: {offer.validUntil}</p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#334155] font-medium transition-colors"
            >
              Close
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onApplyNow?.(offer);
              }}
              className="px-6 py-3 rounded-xl offer-btn-glow font-extrabold"
            >
              Apply Now
            </motion.button>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
