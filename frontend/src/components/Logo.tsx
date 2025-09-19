import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface LogoProps {
  showText?: boolean;
  size?: number;
  className?: string;
  navigateToHome?: boolean;
}

export default function Logo({ showText = true, size = 32, className = "", navigateToHome = false }: LogoProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (navigateToHome) {
      router.push('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      className={`flex items-center space-x-2 cursor-pointer ${className}`}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Image
        src="/logoface.png"
        alt="Max Wonkage Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <span className="text-2xl font-bold text-yellow-400">
          Max Wonkage
        </span>
      )}
    </motion.div>
  );
}
