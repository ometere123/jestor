"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const SEGMENTS = ["BLESSING", "CURSE", "MIRROR", "CONFETTI", "NULL", "CHAOS", "BLESSING", "CURSE"];
const COLORS = ["#35E36D", "#FF3B30", "#00D8C8", "#FF8BD1", "#D8D0BF", "#FFE600", "#35E36D", "#FF3B30"];

interface ChaosWheelProps {
  spinning: boolean;
}

export default function ChaosWheel({ spinning }: ChaosWheelProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (spinning) {
      controls.start({ rotate: [0, 720 + Math.random() * 360], transition: { duration: 1.5, ease: "easeOut" } });
    }
  }, [spinning, controls]);

  return (
    <div className="flex justify-center items-center py-4">
      <motion.div
        animate={controls}
        className="relative w-32 h-32 border-4 border-[#121212] rounded-full overflow-hidden shadow-[4px_4px_0px_#121212]"
        style={{ background: "conic-gradient(#35E36D 0deg 45deg, #FF3B30 45deg 90deg, #00D8C8 90deg 135deg, #FF8BD1 135deg 180deg, #D8D0BF 180deg 225deg, #FFE600 225deg 270deg, #7A35FF 270deg 315deg, #0057FF 315deg 360deg)" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-[#121212] rounded-full border-2 border-[#FFE600] flex items-center justify-center">
            <span className="text-[#FFE600] text-xs font-black">🎲</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
