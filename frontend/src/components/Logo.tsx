import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface LogoProps {
  showText?: boolean;
  size?: number;
  className?: string;
}

export default function Logo({ showText = true, size = 32, className = "" }: LogoProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div 
      className={`flex items-center space-x-2 cursor-pointer ${className}`}
      onClick={scrollToTop}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Image
        src="/logoface.png"
        alt="Curricoolio Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <span className="text-2xl font-bold text-yellow-400">
          CurriCoolio
        </span>
      )}
    </motion.div>
  );
}
