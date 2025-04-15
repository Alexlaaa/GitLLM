'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Circle,
  Search,
  Cog,
  FileCode,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  url: string;
  iconName: string;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name);

  // Helper function to render icons by name
  const renderIcon = (iconName: string) => {
    // Map icon names to components
    switch (iconName.toLowerCase()) {
      case 'search':
        return <Search size={18} strokeWidth={2.5} />;
      case 'cog':
        return <Cog size={18} strokeWidth={2.5} />;
      case 'file-code':
      case 'filecode':
        return <FileCode size={18} strokeWidth={2.5} />;
      case 'settings':
        return <Settings size={18} strokeWidth={2.5} />;
      case 'layout':
      case 'grid':
        return <LayoutGrid size={18} strokeWidth={2.5} />;
      default:
        return <Circle size={18} strokeWidth={2.5} />;
    }
  };

  return (
    <div className={cn('flex justify-center w-full', className)}>
      <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg mt-3 mb-3">
        {' '}
        {/* Add margin-top */}
        {items.map((item) => {
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                'relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors',
                'text-foreground/80 hover:text-primary',
                isActive && 'bg-muted text-primary'
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">{renderIcon(item.iconName)}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
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
