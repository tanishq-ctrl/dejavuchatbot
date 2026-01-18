'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Property } from '@/lib/api';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyMap } from '@/components/property/PropertyMap';
import { LeadModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useShortlist } from '@/lib/shortlist';
import { buildWhatsAppMessage, getAgentWhatsApp, openWhatsApp } from '@/lib/whatsapp';
import { 
    ArrowLeft, MapPin, BedDouble, Bath, Square, Calendar, 
    Building2, Tag, Heart, MessageCircle, Loader2, 
    ChevronLeft, ChevronRight, ExternalLink, Share2, Copy, Check,
    Sparkles, Info, Star, TrendingUp, Home, Ruler, DollarSign
} from 'lucide-react';

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params?.id as string;
    
    const [property, setProperty] = useState<Property | null>(null);
    const [relatedProperties, setRelatedProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageCopied, setImageCopied] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const { showToast } = useToast();
    const { isShortlisted, toggleShortlist } = useShortlist();
    const agentWhatsApp = getAgentWhatsApp();
    const shortlisted = property ? isShortlisted(property.id) : false;

    // Load property details
    useEffect(() => {
        const loadProperty = async () => {
            if (!propertyId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const prop = await api.getProperty(propertyId);
                setProperty(prop);
                
                // Load related properties (same type, similar price range)
                try {
                    const featured = await api.getFeatured();
                    const related = featured
                        .filter(p => p.id !== propertyId && p.property_type === prop.property_type)
                        .slice(0, 6);
                    setRelatedProperties(related);
                } catch (e) {
                    console.error('Failed to load related properties:', e);
                }
            } catch (err: any) {
                console.error('Failed to load property:', err);
                setError(err?.response?.data?.detail || 'Property not found');
                showToast('Failed to load property details', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadProperty();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propertyId]); // Removed showToast from dependencies to prevent infinite loop

    // Handle share
    const handleShare = async () => {
        if (!property) return;
        
        const url = `${window.location.origin}/properties/${property.id}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: property.title,
                    text: `Check out this property: ${property.title}`,
                    url: url,
                });
            } catch (e) {
                // User cancelled or error
                copyToClipboard(url);
            }
        } else {
            copyToClipboard(url);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setUrlCopied(true);
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => setUrlCopied(false), 2000);
    };

    // Format price
    const formatPrice = (price: number | null): string => {
        if (!price) return 'Price on request';
        if (price >= 1000000) {
            return `AED ${(price / 1000000).toFixed(1)}M`;
        }
        return `AED ${price.toLocaleString()}`;
    };

    // Handle WhatsApp
    const handleWhatsApp = () => {
        if (!property || !agentWhatsApp) return;
        
        const message = buildWhatsAppMessage({
            query: property.title,
            properties: [property],
        });
        
        showToast('Opening WhatsApp...', 'info');
        const success = openWhatsApp(message, agentWhatsApp);
        
        if (!success) {
            showToast('Failed to open WhatsApp. Please try again.', 'error');
        }
    };

    // Handle lead submit
    const handleLeadSubmit = async (data: { 
        name: string; 
        contact: string; 
        interest: string;
        email?: string;
        phone?: string;
        message?: string;
        property_id?: string;
    }) => {
        if (!property) return;
        
        try {
            const response = await api.captureLead({
                ...data,
                property_id: property.id,
            });
            showToast(response?.message || 'Request sent successfully!', 'success');
            setSelectedProperty(null);
        } catch (e: any) {
            const errorMessage = e?.response?.data?.detail || 'Failed to send request. Please try again.';
            showToast(errorMessage, 'error');
        }
    };

    // Get property type style
    const getPropertyTypeStyle = (type: string) => {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('villa')) {
            return { bg: 'bg-green-500', text: 'text-white', icon: '🏡', label: 'Villa' };
        } else if (typeLower.includes('penthouse')) {
            return { bg: 'bg-purple-500', text: 'text-white', icon: '🏢', label: 'Penthouse' };
        } else if (typeLower.includes('studio')) {
            return { bg: 'bg-blue-500', text: 'text-white', icon: '🏠', label: 'Studio' };
        } else if (typeLower.includes('apartment')) {
            return { bg: 'bg-amber-500', text: 'text-white', icon: '🏘️', label: 'Apartment' };
        }
        return { bg: 'bg-gray-500', text: 'text-white', icon: '🏛️', label: type };
    };

    // Get status style
    const getStatusStyle = (status: string | null | undefined) => {
        if (!status) return null;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('ready')) {
            return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', label: 'Ready to Move', icon: '✅' };
        } else if (statusLower.includes('off-plan') || statusLower.includes('offplan')) {
            return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', label: 'Off-Plan', icon: '🏗️' };
        }
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: status, icon: '📋' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <Loader2 className="animate-spin h-16 w-16 text-amber-600 mx-auto mb-6" />
                        <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-50 animate-pulse" />
                    </div>
                    <p className="text-gray-700 font-medium text-lg mt-4">Loading property details...</p>
                    <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
                </div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="relative mb-6">
                        <Building2 className="h-20 w-20 text-gray-300 mx-auto" />
                        <div className="absolute inset-0 bg-gray-200 rounded-full blur-2xl opacity-50" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Property Not Found</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">{error || 'The property you are looking for does not exist or may have been removed.'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-bold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 mx-auto"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </button>
                </div>
            </div>
        );
    }

    const pricePerSqft = property.price_aed && property.size_sqft && property.size_sqft > 0
        ? Math.round(property.price_aed / property.size_sqft)
        : null;

    const typeStyle = getPropertyTypeStyle(property.property_type);
    const statusStyle = getStatusStyle(property.status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Enhanced Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-200 group"
                        >
                            <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            </div>
                            <span className="font-semibold">Back</span>
                        </button>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => toggleShortlist(property)}
                                className={`p-3 rounded-xl transition-all duration-200 ${
                                    shortlisted
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                            >
                                <Heart size={20} className={shortlisted ? 'fill-current' : ''} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                                title="Share property"
                            >
                                {urlCopied ? <Check size={20} className="text-green-600" /> : <Share2 size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Images & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Enhanced Image Gallery */}
                        <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl group">
                            {property.image_url ? (
                                <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
                                            <Home size={48} className="text-gray-300" />
                                        </div>
                                    )}
                                    <img
                                        src={property.image_url}
                                        alt={property.title}
                                        className={`w-full h-full object-cover transition-all duration-700 ${
                                            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                                        } group-hover:scale-110`}
                                        onLoad={() => setImageLoaded(true)}
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                                    
                                    {/* Badges Overlay */}
                                    <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                                        {property.featured && (
                                            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-sm">
                                                <Sparkles size={16} className="animate-pulse" />
                                                <span>FEATURED</span>
                                            </div>
                                        )}
                                        {statusStyle && (
                                            <div className={`${statusStyle.bg} ${statusStyle.text} border-2 ${statusStyle.border} text-sm font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2`}>
                                                <span className="text-base">{statusStyle.icon}</span>
                                                <span>{statusStyle.label}</span>
                                            </div>
                                        )}
                                        {typeStyle && (
                                            <div className={`${typeStyle.bg} ${typeStyle.text} text-sm font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2`}>
                                                <span className="text-base">{typeStyle.icon}</span>
                                                <span>{typeStyle.label}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Badge on Image */}
                                    <div className="absolute bottom-6 left-6 right-6 z-10">
                                        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
                                            <div className="text-4xl font-extrabold text-gray-900 mb-1">
                                                {formatPrice(property.price_aed)}
                                            </div>
                                            {pricePerSqft && (
                                                <div className="text-sm text-gray-600 font-semibold">
                                                    AED {pricePerSqft.toLocaleString()} per sqft
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex items-center justify-center">
                                    <div className="text-center">
                                        <Home size={64} className="text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 font-medium">No image available</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Property Info */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
                            {/* Title & Location */}
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{property.title}</h1>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin size={20} className="text-amber-600" />
                                    <span className="text-lg font-semibold">{property.community}</span>
                                    {property.city && property.city !== property.community && (
                                        <span className="text-gray-400">• {property.city}</span>
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Key Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t-2 border-gray-100">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 text-center border-2 border-blue-200 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                                        <BedDouble size={20} />
                                        <span className="text-xs font-bold uppercase tracking-wide">Bedrooms</span>
                                    </div>
                                    <div className="text-3xl font-extrabold text-blue-900">
                                        {property.bedrooms === 0 ? 'Studio' : property.bedrooms}
                                    </div>
                                </div>
                                
                                {property.bathrooms && (
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 text-center border-2 border-purple-200 hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center justify-center gap-2 text-purple-700 mb-2">
                                            <Bath size={20} />
                                            <span className="text-xs font-bold uppercase tracking-wide">Bathrooms</span>
                                        </div>
                                        <div className="text-3xl font-extrabold text-purple-900">{property.bathrooms}</div>
                                    </div>
                                )}
                                
                                {property.size_sqft && (
                                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 text-center border-2 border-emerald-200 hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center justify-center gap-2 text-emerald-700 mb-2">
                                            <Square size={20} />
                                            <span className="text-xs font-bold uppercase tracking-wide">Size</span>
                                        </div>
                                        <div className="text-3xl font-extrabold text-emerald-900">
                                            {property.size_sqft.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-emerald-700 font-semibold mt-1">sqft</div>
                                    </div>
                                )}
                                
                                {pricePerSqft && (
                                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 text-center border-2 border-amber-200 hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                                            <DollarSign size={20} />
                                            <span className="text-xs font-bold uppercase tracking-wide">Price/sqft</span>
                                        </div>
                                        <div className="text-3xl font-extrabold text-amber-900">
                                            {pricePerSqft.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-amber-700 font-semibold mt-1">AED</div>
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Additional Info */}
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-gray-100">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Property Type</span>
                                    <p className="font-bold text-gray-900 text-lg">{property.property_type}</p>
                                </div>
                                {property.status && (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Status</span>
                                        <p className="font-bold text-gray-900 text-lg">{property.status}</p>
                                    </div>
                                )}
                                {property.cluster_label && (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Category</span>
                                        <p className="font-bold text-gray-900 text-lg">{property.cluster_label}</p>
                                    </div>
                                )}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Property ID</span>
                                    <p className="font-mono font-bold text-gray-900 text-lg">{property.id}</p>
                                </div>
                            </div>

                            {/* Enhanced Match Score */}
                            {property.match_score !== null && property.match_score !== undefined && (
                                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 pt-6 border-t-2 border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500 rounded-xl">
                                                <TrendingUp size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Match Score</span>
                                                <p className="text-xs text-gray-600">How well this property matches your criteria</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-extrabold text-blue-700">
                                                {Math.round(property.match_score)}
                                            </span>
                                            <span className="text-xl font-bold text-blue-600">/100</span>
                                        </div>
                                    </div>
                                    
                                    {/* Enhanced Progress Bar */}
                                    <div className="relative w-full bg-blue-100 rounded-full h-4 mb-4 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                property.match_score >= 80
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                    : property.match_score >= 60
                                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                                    : property.match_score >= 40
                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                            } shadow-lg`}
                                            style={{ width: `${Math.min(property.match_score, 100)}%` }}
                                        />
                                    </div>
                                    
                                    {/* Top Reasons */}
                                    {property.top_reasons && property.top_reasons.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                            <p className="text-sm font-bold text-gray-700 mb-2">Top Reasons:</p>
                                            {property.top_reasons.slice(0, 4).map((reason, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-white/80 rounded-xl p-3 border border-blue-200">
                                                    <Star size={16} className="text-amber-500 mt-0.5 fill-current shrink-0" />
                                                    <span className="text-sm text-gray-700 font-medium">{reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Enhanced Location Section with Map */}
                            <div className="pt-6 border-t-2 border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={24} className="text-amber-600" />
                                        <h3 className="text-2xl font-bold text-gray-900">Location</h3>
                                    </div>
                                </div>
                                <PropertyMap
                                    address={`${property.community}, ${property.city}`}
                                    community={property.community}
                                    city={property.city}
                                    propertyTitle={property.title}
                                />
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-semibold">📍 Address:</span> {property.community}, {property.city}, UAE
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Right Column - CTA & Actions */}
                    <div className="space-y-6">
                        {/* Enhanced Contact Card */}
                        <div className="bg-white rounded-3xl shadow-2xl p-6 sticky top-28 border border-gray-200">
                            <div className="text-center mb-6 pb-6 border-b-2 border-gray-100">
                                <div className="text-5xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
                                    {formatPrice(property.price_aed)}
                                </div>
                                {pricePerSqft && (
                                    <div className="text-sm text-gray-600 font-semibold flex items-center justify-center gap-1">
                                        <DollarSign size={14} />
                                        <span>AED {pricePerSqft.toLocaleString()}/sqft</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setSelectedProperty(property)}
                                    className="w-full bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 text-white py-4 rounded-xl font-bold text-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <MessageCircle size={20} />
                                    <span>Show Interest</span>
                                </button>

                                {agentWhatsApp && (
                                    <button
                                        onClick={handleWhatsApp}
                                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <MessageCircle size={20} />
                                        <span>WhatsApp Agent</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => toggleShortlist(property)}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3 ${
                                        shortlisted
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                                    }`}
                                >
                                    <Heart size={20} className={shortlisted ? 'fill-current' : ''} />
                                    <span>{shortlisted ? 'Remove from Shortlist' : 'Save to Shortlist'}</span>
                                </button>
                            </div>

                            {/* Property ID */}
                            <div className="mt-6 pt-6 border-t-2 border-gray-100">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Property ID</div>
                                <div className="text-sm font-mono font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{property.id}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Related Properties */}
                {relatedProperties.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Similar Properties</h2>
                                <p className="text-gray-600">Other {property.property_type.toLowerCase()}s you might like</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedProperties.map((prop) => (
                                <PropertyCard
                                    key={prop.id}
                                    property={prop}
                                    onInterest={setSelectedProperty}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Lead Modal */}
            {selectedProperty && (
                <LeadModal
                    property={selectedProperty}
                    onClose={() => setSelectedProperty(null)}
                    onSubmit={handleLeadSubmit}
                />
            )}
        </div>
    );
}
