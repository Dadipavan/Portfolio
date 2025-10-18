import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { useState } from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, setIsOpen }) => {
  const menuItems = ['About', 'Skills', 'Projects', 'Experience', 'Education', 'Certifications', 'Contact'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <span className="text-white font-bold text-xl">Sai Pavan</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white p-2"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-8 px-8">
              {menuItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsOpen(false)}
                  className="text-white text-2xl font-semibold hover:text-purple-400 transition-colors"
                >
                  {item}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;