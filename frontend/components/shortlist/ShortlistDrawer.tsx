'use client';

import { X, Trash2, GitCompare, Heart, Building2, Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { useShortlist } from '@/lib/shortlist';
import { Property } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { buildWhatsAppMessage, getAgentWhatsApp, openWhatsApp, WhatsAppCriteria } from '@/lib/whatsapp';
import { useToast } from '@/components/ui/Toast';

interface ShortlistDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userQuery?: string;
    criteria?: WhatsAppCriteria;
}

/**
 * Shortlist Drawer Component
 * Displays saved properties with options to remove and compare
 */
export function ShortlistDrawer({ isOpen, onClose, userQuery, criteria }: ShortlistDrawerProps) {
    const { shortlist, removeFromShortlist, clearShortlist } = useShortlist();
    const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const { showToast, ToastComponent } = useToast();
    const agentWhatsApp = getAgentWhatsApp();

    // Toggle property selection for comparison
    const toggleSelection = (propertyId: string) => {
        const newSelected = new Set(selectedForCompare);
        if (newSelected.has(propertyId)) {
            newSelected.delete(propertyId);
        } else {
            if (newSelected.size < 5) {
                newSelected.add(propertyId);
            }
        }
        setSelectedForCompare(newSelected);
    };

    // Handle compare action
    const handleCompare = () => {
        if (selectedForCompare.size === 0) return;
        // Store selected IDs in sessionStorage for compare page
        sessionStorage.setItem('compare_properties', JSON.stringify(Array.from(selectedForCompare)));
        router.push('/compare');
        onClose();
    };

    // Handle clear shortlist
    const handleClear = () => {
        clearShortlist();
        setShowClearConfirm(false);
        onClose();
    };

    // Handle share shortlist
    const handleShare = async () => {
        if (shortlist.length === 0) return;
        
        setSharing(true);
        try {
            const propertyIds = shortlist.map(p => p.id);
            const result = await api.shareShortlist(propertyIds);
            const fullUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}${result.share_url}`
                : result.share_url;
            setShareUrl(fullUrl);
        } catch (error: any) {
            console.error('Failed to share shortlist:', error);
            alert('Failed to create shareable link. Please try again.');
        } finally {
            setSharing(false);
        }
    };

    // Handle copy share URL
    const handleCopy = async () => {
        if (!shareUrl) return;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy URL:', error);
            alert('Failed to copy link. Please copy manually.');
        }
    };

    // Handle WhatsApp share
    const handleWhatsApp = () => {
        if (shortlist.length === 0) {
            showToast('No properties in shortlist', 'warning');
            return;
        }

        if (!agentWhatsApp) {
            console.error('[ShortlistDrawer] WhatsApp not configured');
            showToast('WhatsApp number not configured. Please set NEXT_PUBLIC_AGENT_WHATSAPP in .env.local', 'error');
            return;
        }
        
        try {
            const message = buildWhatsAppMessage({
                query: userQuery,
                criteria: criteria,
                properties: shortlist,
            });
            
            console.log('[ShortlistDrawer] WhatsApp message:', message);
            showToast('Opening WhatsApp...', 'info');
            
            const success = openWhatsApp(message, agentWhatsApp);
            
            if (!success) {
                showToast('Failed to open WhatsApp. Please check console for details.', 'error');
            }
        } catch (error) {
            console.error('[ShortlistDrawer] WhatsApp error:', error);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100">
                    <div className="flex items-center gap-3">
                        <Heart size={24} className="text-red-500 fill-current" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">My Shortlist</h2>
                            <p className="text-sm text-gray-600">{shortlist.length} {shortlist.length === 1 ? 'property' : 'properties'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Close drawer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {shortlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Heart size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">Your shortlist is empty</p>
                            <p className="text-sm mt-2">Start saving properties to compare them!</p>
                        </div>
                    ) : (
                        <>
                            {shortlist.map((property) => (
                                <ShortlistItem
                                    key={property.id}
                                    property={property}
                                    isSelected={selectedForCompare.has(property.id)}
                                    onToggleSelect={() => toggleSelection(property.id)}
                                    onRemove={() => removeFromShortlist(property.id)}
                                    canSelect={selectedForCompare.size < 5}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                {shortlist.length > 0 && (
                    <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                        {selectedForCompare.size > 0 && (
                            <button
                                onClick={handleCompare}
                                disabled={selectedForCompare.size === 0}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl font-bold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <GitCompare size={18} />
                                Compare {selectedForCompare.size} {selectedForCompare.size === 1 ? 'Property' : 'Properties'}
                            </button>
                        )}
                        
                        {/* Share Section */}
                        {shareUrl && (
                            <div className="bg-white border-2 border-amber-200 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-semibold text-gray-700">Shareable Link:</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="flex-1 text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-gray-700 truncate"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                                        title={copied ? 'Copied!' : 'Copy link'}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {agentWhatsApp && (
                            <button
                                onClick={handleWhatsApp}
                                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MessageCircle size={18} />
                                Send Shortlist on WhatsApp
                            </button>
                        )}
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleShare}
                                disabled={sharing}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Share2 size={16} />
                                {sharing ? 'Sharing...' : 'Share'}
                            </button>
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                <Trash2 size={16} />
                                Clear All
                            </button>
                            <button
                                onClick={() => router.push('/compare')}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                            >
                                <GitCompare size={16} />
                                View All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Clear Confirmation Modal */}
            {showClearConfirm && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Shortlist?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to remove all {shortlist.length} properties from your shortlist? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 py-2.5 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/**
 * Individual Shortlist Item Component
 */
function ShortlistItem({
    property,
    isSelected,
    onToggleSelect,
    onRemove,
    canSelect,
}: {
    property: Property;
    isSelected: boolean;
    onToggleSelect: () => void;
    onRemove: () => void;
    canSelect: boolean;
}) {
    const formatPrice = (price: number | null): string => {
        if (!price) return 'Price on request';
        if (price >= 1000000) {
            return `AED ${(price / 1000000).toFixed(1)}M`;
        }
        return `AED ${price.toLocaleString()}`;
    };

    return (
        <div className={`border-2 rounded-xl p-4 transition-all duration-200 ${
            isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
        }`}>
            <div className="flex gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {property.image_url && property.image_url.startsWith('http') ? (
                        <img
                            src={property.image_url}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Building2 size={24} className="text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">
                        {property.title}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">{property.community}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        {property.bedrooms !== undefined && (
                            <span>{property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Bed`}</span>
                        )}
                        {property.bathrooms && <span>{property.bathrooms} Bath</span>}
                        {property.size_sqft && <span>{property.size_sqft.toLocaleString()} sqft</span>}
                    </div>
                    <p className="font-bold text-amber-700 text-sm">
                        {formatPrice(property.price_aed)}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={onToggleSelect}
                        disabled={!canSelect && !isSelected}
                        className={`p-2 rounded-lg border-2 transition-all ${
                            isSelected
                                ? 'bg-amber-500 border-amber-600 text-white'
                                : canSelect
                                ? 'border-gray-300 text-gray-600 hover:border-amber-500 hover:text-amber-600'
                                : 'border-gray-200 text-gray-300 cursor-not-allowed'
                        }`}
                        title={isSelected ? 'Deselect for comparison' : canSelect ? 'Select for comparison' : 'Maximum 5 properties'}
                    >
                        <GitCompare size={16} />
                    </button>
                    <button
                        onClick={onRemove}
                        className="p-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Remove from shortlist"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
