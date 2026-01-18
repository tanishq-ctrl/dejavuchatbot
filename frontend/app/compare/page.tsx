'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CompareView } from '@/components/shortlist/CompareView';
import { Property } from '@/lib/api';
import { useShortlist } from '@/lib/shortlist';
import { api } from '@/lib/api';
import { buildWhatsAppMessage, getAgentWhatsApp, openWhatsApp, WhatsAppCriteria } from '@/lib/whatsapp';
import { useToast } from '@/components/ui/Toast';
import { Building2, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';

/**
 * Compare Page Content
 * Displays properties for side-by-side comparison
 * Supports loading from shortlist store or shared shortlist via share_id
 */
function ComparePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { shortlist, removeFromShortlist } = useShortlist();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast, ToastComponent } = useToast();
    const agentWhatsApp = getAgentWhatsApp();

    // Get share_id from URL params
    const shareId = searchParams.get('share_id');

    useEffect(() => {
        const loadProperties = async () => {
            setLoading(true);
            setError(null);

            try {
                if (shareId) {
                    // Load from shared shortlist via API
                    try {
                        const sharedProperties = await api.getSharedShortlist(shareId);
                        setProperties(sharedProperties);
                    } catch (err: any) {
                        console.error('Failed to load shared shortlist:', err);
                        setError('Failed to load shared shortlist. The link may be invalid or expired.');
                        // Fallback to local shortlist
                        const selectedIds = sessionStorage.getItem('compare_properties');
                        if (selectedIds) {
                            const ids = JSON.parse(selectedIds) as string[];
                            const selected = shortlist.filter(p => ids.includes(p.id));
                            setProperties(selected);
                        } else {
                            setProperties(shortlist);
                        }
                    }
                } else {
                    // Load from sessionStorage (if coming from drawer) or use full shortlist
                    const selectedIds = sessionStorage.getItem('compare_properties');
                    if (selectedIds) {
                        const ids = JSON.parse(selectedIds) as string[];
                        const selected = shortlist.filter(p => ids.includes(p.id));
                        setProperties(selected);
                        // Clear sessionStorage after loading
                        sessionStorage.removeItem('compare_properties');
                    } else {
                        // Use all shortlisted properties (up to 5)
                        setProperties(shortlist.slice(0, 5));
                    }
                }
            } catch (err: any) {
                console.error('Error loading properties:', err);
                setError('Failed to load properties. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadProperties();
    }, [shareId, shortlist]);

    const handleRemove = (propertyId: string) => {
        removeFromShortlist(propertyId);
        setProperties(prev => prev.filter(p => p.id !== propertyId));
    };

    // Handle WhatsApp share from compare page
    const handleWhatsApp = () => {
        if (properties.length === 0) {
            showToast('No properties to compare', 'warning');
            return;
        }

        if (!agentWhatsApp) {
            console.error('[ComparePage] WhatsApp not configured');
            showToast('WhatsApp number not configured. Please set NEXT_PUBLIC_AGENT_WHATSAPP in .env.local', 'error');
            return;
        }
        
        try {
            const message = buildWhatsAppMessage({
                query: 'Property comparison',
                properties: properties,
            });
            
            console.log('[ComparePage] WhatsApp message:', message);
            showToast('Opening WhatsApp...', 'info');
            
            const success = openWhatsApp(message, agentWhatsApp);
            
            if (!success) {
                showToast('Failed to open WhatsApp. Please check console for details.', 'error');
            }
        } catch (error) {
            console.error('[ComparePage] WhatsApp error:', error);
            showToast('An error occurred. Please try again.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="mx-auto text-amber-600 animate-spin mb-4" />
                    <p className="text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Go back"
                            >
                                <ArrowLeft size={20} className="text-gray-700" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="bg-black text-amber-500 p-2 rounded-lg">
                                    <Building2 size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Compare Properties</h1>
                                    <p className="text-sm text-gray-600">
                                        {properties.length} {properties.length === 1 ? 'property' : 'properties'} selected
                                    </p>
                                </div>
                            </div>
                        </div>
                        {agentWhatsApp && properties.length > 0 && (
                            <button
                                onClick={handleWhatsApp}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                            >
                                <MessageCircle size={18} />
                                <span className="hidden sm:inline">Send on WhatsApp</span>
                                <span className="sm:hidden">WhatsApp</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error ? (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-700 font-semibold mb-2">Error</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                        <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No properties to compare</h2>
                        <p className="text-gray-600 mb-6">
                            Add properties to your shortlist to compare them side-by-side.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
                        >
                            Browse Properties
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
                        <CompareView properties={properties} onRemove={handleRemove} />
                    </div>
                )}

                {/* Max properties warning */}
                {properties.length >= 5 && (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> You can compare up to 5 properties at a time. Remove a property to add another.
                        </p>
                    </div>
                )}
            </main>

            {/* Toast Notification */}
            {ToastComponent}
        </div>
    );
}

/**
 * Compare Page Wrapper with Suspense
 * Wraps the compare page content in Suspense for useSearchParams()
 * Force dynamic rendering to avoid static generation issues
 */
export const dynamic = 'force-dynamic';

export default function ComparePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="mx-auto text-amber-600 animate-spin mb-4" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ComparePageContent />
        </Suspense>
    );
}
