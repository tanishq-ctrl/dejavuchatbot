'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Property } from './api';

/**
 * Shortlist Store using React Context + localStorage
 * Manages shortlisted properties with persistence across page refreshes
 */

interface ShortlistContextType {
    shortlist: Property[];
    isShortlisted: (propertyId: string) => boolean;
    addToShortlist: (property: Property) => void;
    removeFromShortlist: (propertyId: string) => void;
    clearShortlist: () => void;
    toggleShortlist: (property: Property) => void;
}

const ShortlistContext = createContext<ShortlistContextType | undefined>(undefined);

const STORAGE_KEY = 'deja-vu-shortlist';

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
    const [shortlist, setShortlist] = useState<Property[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Property[];
                setShortlist(parsed);
            }
        } catch (error) {
            console.error('Failed to load shortlist from localStorage:', error);
        }
    }, []);

    // Save to localStorage whenever shortlist changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(shortlist));
        } catch (error) {
            console.error('Failed to save shortlist to localStorage:', error);
        }
    }, [shortlist]);

    const isShortlisted = useCallback((propertyId: string): boolean => {
        return shortlist.some(p => p.id === propertyId);
    }, [shortlist]);

    const addToShortlist = useCallback((property: Property) => {
        setShortlist(prev => {
            // Avoid duplicates
            if (prev.some(p => p.id === property.id)) {
                return prev;
            }
            return [...prev, property];
        });
    }, []);

    const removeFromShortlist = useCallback((propertyId: string) => {
        setShortlist(prev => prev.filter(p => p.id !== propertyId));
    }, []);

    const toggleShortlist = useCallback((property: Property) => {
        setShortlist(prev => {
            const exists = prev.some(p => p.id === property.id);
            if (exists) {
                return prev.filter(p => p.id !== property.id);
            } else {
                return [...prev, property];
            }
        });
    }, []);

    const clearShortlist = useCallback(() => {
        setShortlist([]);
    }, []);

    return (
        <ShortlistContext.Provider
            value={{
                shortlist,
                isShortlisted,
                addToShortlist,
                removeFromShortlist,
                clearShortlist,
                toggleShortlist,
            }}
        >
            {children}
        </ShortlistContext.Provider>
    );
}

export function useShortlist() {
    const context = useContext(ShortlistContext);
    if (!context) {
        throw new Error('useShortlist must be used within ShortlistProvider');
    }
    return context;
}
