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
            className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-lg font-bold text-white mb-6 shadow-lg"
          >
            {offer.discount}% OFF
          </motion.span>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{offer.title}</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">{offer.description}</p>
          {offer.validUntil && (
            <p className="text-sm text-gray-500 mb-4">Valid until: {offer.validUntil}</p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-6 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              Close
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, boxShadow: "0 10px 30px -5px rgba(251, 191, 36, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onApplyNow?.(offer);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white shadow-lg"
            >
              Apply Now
            </motion.button>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
