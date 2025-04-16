'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
// No longer need icons as we're only showing text
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  url: string;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name);

  // Icon rendering no longer needed

  return (
    <div className={cn('flex justify-center w-full', className)}>
      <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 border border-indigo-400/20 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg mt-3 mb-3">
        {' '}
        {items.map((item) => {
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                'relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors',
                'text-white/80 hover:text-white',
                isActive && 'bg-white/20 text-white'
              )}
            >
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-white/10 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-300 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-amber-300/30 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-amber-300/30 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-amber-300/30 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
