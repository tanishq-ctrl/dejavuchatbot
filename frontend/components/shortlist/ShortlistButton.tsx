'use client';

import { Heart, X } from 'lucide-react';
import { useShortlist } from '@/lib/shortlist';
import { useState } from 'react';
import { ShortlistDrawer } from './ShortlistDrawer';
import { WhatsAppCriteria } from '@/lib/whatsapp';

/**
 * Floating Shortlist Button
 * Displays count of shortlisted properties and opens drawer on click
 */
interface ShortlistButtonProps {
    userQuery?: string;
    criteria?: WhatsAppCriteria;
}

export function ShortlistButton({ userQuery, criteria }: ShortlistButtonProps = {}) {
    const { shortlist } = useShortlist();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const count = shortlist.length;

    if (count === 0) return null; // Don't show if no items

    return (
        <>
            <button
                onClick={() => setIsDrawerOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3 font-bold text-lg group"
                aria-label={`Open shortlist (${count} items)`}
            >
                <div className="relative">
                    <Heart size={24} className="fill-current" />
                    {count > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {count > 9 ? '9+' : count}
                        </span>
                    )}
                </div>
                <span className="hidden sm:inline">Shortlist ({count})</span>
            </button>

            {isDrawerOpen && (
                <ShortlistDrawer 
                    isOpen={isDrawerOpen} 
                    onClose={() => setIsDrawerOpen(false)}
                    userQuery={userQuery}
                    criteria={criteria}
                />
            )}
        </>
    );
}
