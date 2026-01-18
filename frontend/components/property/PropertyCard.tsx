import { Property } from "@/lib/api";
import { MapPin, BedDouble, Home, ArrowRight, Building2, Tag, Bath, Square, Sparkles, Calendar, Heart, MessageCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShortlist } from '@/lib/shortlist';
import { buildWhatsAppMessage, getAgentWhatsApp, openWhatsApp, WhatsAppCriteria } from '@/lib/whatsapp';
import { useToast } from '@/components/ui/Toast';

interface PropertyCardProps {
    property: Property;
    onInterest: (p: Property) => void;
    userQuery?: string;
    criteria?: WhatsAppCriteria;
}

export function PropertyCard({ property, onInterest, userQuery, criteria }: PropertyCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
    const { isShortlisted, toggleShortlist } = useShortlist();
    const { showToast } = useToast();
    const router = useRouter();
    const shortlisted = isShortlisted(property.id);
    const agentWhatsApp = getAgentWhatsApp();
    
    // Debug: Log WhatsApp button visibility
    if (process.env.NODE_ENV === 'development' && !agentWhatsApp) {
        console.log('[PropertyCard] WhatsApp button hidden - NEXT_PUBLIC_AGENT_WHATSAPP not set');
    }

    // Format price for display
    const formatPrice = (price: number | null): string => {
        if (!price) return 'Price on request';
        if (price >= 1000000) {
            return `AED ${(price / 1000000).toFixed(1)}M`;
        }
        return `AED ${price.toLocaleString()}`;
    };

    // Calculate price per sqft
    const pricePerSqft = property.price_aed && property.size_sqft && property.size_sqft > 0
        ? Math.round(property.price_aed / property.size_sqft)
        : null;

    // Get property type icon/color
    const getPropertyTypeStyle = (type: string) => {
        const typeLower = type.toLowerCase();
        if (typeLower.includes('villa')) {
            return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Villa' };
        } else if (typeLower.includes('penthouse')) {
            return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Penthouse' };
        } else if (typeLower.includes('studio')) {
            return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Studio' };
        } else if (typeLower.includes('townhouse')) {
            return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Townhouse' };
        }
        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: type };
    };

    // Get status badge style
    const getStatusStyle = (status: string | null | undefined) => {
        if (!status) return null;
        const statusLower = status.toLowerCase();
        if (statusLower.includes('off-plan') || statusLower.includes('off plan')) {
            return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Off-Plan' };
        } else if (statusLower.includes('ready')) {
            return { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' };
        }
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    };

    const typeStyle = getPropertyTypeStyle(property.property_type);
    const statusStyle = getStatusStyle(property.status);

    // Handle WhatsApp click
    const handleWhatsApp = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log('[PropertyCard] WhatsApp button clicked');
        console.log('[PropertyCard] Agent WhatsApp:', agentWhatsApp);
        
        if (!agentWhatsApp) {
            console.error('[PropertyCard] WhatsApp not configured');
            showToast('WhatsApp number not configured. Please set NEXT_PUBLIC_AGENT_WHATSAPP in .env.local', 'error');
            return;
        }

        try {
            const message = buildWhatsAppMessage({
                query: userQuery,
                criteria: criteria,
                properties: [property],
            });
            
            console.log('[PropertyCard] ===== WHATSAPP REQUEST =====');
            console.log('[PropertyCard] Property:', property.title);
            console.log('[PropertyCard] Agent WhatsApp:', agentWhatsApp);
            console.log('[PropertyCard] Full message:', message);
            console.log('[PropertyCard] =============================');
            
            showToast('Opening WhatsApp...', 'info');
            
            // Open immediately (don't use setTimeout - might interfere with user gesture)
            const success = openWhatsApp(message, agentWhatsApp);
            
            if (!success) {
                showToast('Failed to open WhatsApp. Please check console for details.', 'error');
                console.error('[PropertyCard] openWhatsApp returned false');
            }
        } catch (error) {
            console.error('[PropertyCard] WhatsApp error:', error);
            showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    // Handle card click to navigate to detail page
    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on buttons or interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) {
            return;
        }
        router.push(`/properties/${property.id}`);
    };

    return (
        <div 
            className="group relative bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-2xl hover:border-amber-400 transition-all duration-500 flex flex-col h-full cursor-pointer transform hover:-translate-y-1"
            onClick={handleCardClick}
        >
            {/* Image Section with Loading State */}
            <div className="h-64 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 relative overflow-hidden">
                {!imageError && property.image_url && property.image_url.startsWith('http') ? (
                    <>
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
                                <Home size={32} className="text-gray-300" />
                            </div>
                        )}
                        <img
                            src={property.image_url}
                            alt={property.title}
                            className={`w-full h-full object-cover transition-all duration-500 ${
                                imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                            } group-hover:scale-110`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => {
                                setImageError(true);
                                setImageLoaded(false);
                            }}
                        />
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                            <Home size={48} className="mx-auto text-gray-400 mb-2" strokeWidth={1.5} />
                            <p className="text-xs text-gray-400 font-medium">{property.property_type}</p>
                        </div>
                    </div>
                )}
                
                {/* Badges Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {property.featured && (
                        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 animate-pulse">
                            <Sparkles size={12} className="animate-spin-slow" />
                            EXCLUSIVE
                        </div>
                    )}
                    {statusStyle && (
                        <div className={`${statusStyle.bg} ${statusStyle.text} text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm`}>
                            <Calendar size={11} className="inline mr-1" />
                            {statusStyle.label}
                        </div>
                    )}
                </div>
                
                {/* Shortlist Button (Top Right) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleShortlist(property);
                    }}
                    className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md shadow-lg transition-all duration-300 ${
                        shortlisted
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-500'
                    }`}
                    aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                >
                    <Heart size={18} className={shortlisted ? 'fill-current' : ''} />
                </button>

                {property.cluster_label && (
                    <div className="absolute top-3 right-12 bg-black/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10 shadow-lg">
                        {property.cluster_label}
                    </div>
                )}

                {/* Property Type Badge */}
                <div className={`absolute bottom-3 left-3 ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border} text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-md`}>
                    <Building2 size={12} className="inline mr-1.5" />
                    {typeStyle.label}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-grow">
                {/* Title */}
                <h3 className="font-bold text-xl text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors mb-3 leading-tight">
                            {property.title}
                        </h3>

                {/* Location */}
                <div className="flex items-center text-gray-600 text-sm mb-4">
                    <MapPin size={15} className="mr-2 text-amber-600 flex-shrink-0" />
                    <span className="line-clamp-1 font-medium">{property.community}</span>
                    {property.city && property.city !== property.community && (
                        <span className="text-gray-400 ml-1">, {property.city}</span>
                    )}
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <BedDouble size={16} className="text-gray-600" />
                        <div>
                            <div className="text-xs text-gray-500">Bedrooms</div>
                            <div className="text-sm font-bold text-gray-900">
                                {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms}`}
                            </div>
                        </div>
                    </div>
                    
                    {property.bathrooms && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                            <Bath size={16} className="text-gray-600" />
                            <div>
                                <div className="text-xs text-gray-500">Bathrooms</div>
                                <div className="text-sm font-bold text-gray-900">{property.bathrooms}</div>
                            </div>
                        </div>
                    )}
                    
                    {property.size_sqft && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                            <Square size={16} className="text-gray-600" />
                            <div>
                                <div className="text-xs text-gray-500">Size</div>
                                <div className="text-sm font-bold text-gray-900">
                                    {property.size_sqft.toLocaleString()} sqft
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {pricePerSqft && (
                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                            <Tag size={16} className="text-amber-600" />
                            <div>
                                <div className="text-xs text-amber-600">Price/sqft</div>
                                <div className="text-sm font-bold text-amber-700">
                                    AED {pricePerSqft.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Price Section */}
                <div className="mb-4 pb-4 border-b-2 border-gray-100">
                    <div className="flex items-baseline justify-between">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Total Price</div>
                            <div className="text-2xl font-extrabold text-gray-900">
                                {formatPrice(property.price_aed)}
                            </div>
                    </div>
                        {property.price_aed && property.price_aed >= 1000000 && (
                            <div className="text-right">
                                <div className="text-xs text-gray-400">Full Amount</div>
                                <div className="text-sm font-semibold text-gray-600">
                        {property.price_aed.toLocaleString()} AED
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Match Score */}
                {property.match_score !== null && property.match_score !== undefined && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Info size={16} className="text-blue-600" />
                                <span className="text-sm font-bold text-blue-900">Match Score</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-blue-700">
                                    {Math.round(property.match_score)}
                                </span>
                                <span className="text-xs font-semibold text-blue-600">/ 100</span>
                            </div>
                        </div>
                        
                        {/* Score Bar */}
                        <div className="w-full bg-blue-100 rounded-full h-2.5 mb-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    property.match_score >= 80
                                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                                        : property.match_score >= 60
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                        : property.match_score >= 40
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}
                                style={{ width: `${Math.min(property.match_score, 100)}%` }}
                            />
                        </div>
                        
                        {/* Top Reasons (if available) */}
                        {(property.top_reasons && property.top_reasons.length > 0) && (
                            <div className="mt-2 space-y-1">
                                {property.top_reasons.slice(0, 2).map((reason, idx) => (
                                    <p key={idx} className="text-xs text-blue-800 font-medium flex items-start gap-1.5">
                                        <span className="mt-0.5 block w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                                        <span>{reason}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                        
                        {/* Expandable Breakdown */}
                        {property.score_breakdown && property.score_breakdown.length > 0 && (
                            <button
                                onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                                className="mt-2 w-full flex items-center justify-between text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                            >
                                <span className="flex items-center gap-1">
                                    <Info size={12} />
                                    Why this score?
                                </span>
                                {showScoreBreakdown ? (
                                    <ChevronUp size={14} />
                                ) : (
                                    <ChevronDown size={14} />
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Score Breakdown (Expandable) */}
                {showScoreBreakdown && property.score_breakdown && property.score_breakdown.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Score Breakdown</h4>
                        {property.score_breakdown.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-700">{item.factor}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">({item.weight} pts)</span>
                                        <span className={`text-xs font-bold ${
                                            item.points === item.weight
                                                ? 'text-green-600'
                                                : item.points > 0
                                                ? 'text-amber-600'
                                                : 'text-gray-400'
                                        }`}>
                                            {item.points.toFixed(1)} / {item.weight}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600">{item.value}</span>
                                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                item.points === item.weight
                                                    ? 'bg-green-500'
                                                    : item.points > 0
                                                    ? 'bg-amber-500'
                                                    : 'bg-gray-300'
                                            }`}
                                            style={{ width: `${(item.points / item.weight) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 italic">{item.explanation}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Match Reasons (Fallback if no scoring) */}
                {(!property.match_score && property.match_score !== 0) && property.match_reasons && property.match_reasons.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={12} />
                            Why this property:
                        </p>
                        <ul className="text-xs text-gray-700 space-y-1.5">
                            {property.match_reasons.slice(0, 2).map((r, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span className="leading-relaxed font-medium">{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* CTA Buttons */}
                <div className="mt-auto pt-2 space-y-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/properties/${property.id}`);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-3.5 rounded-xl text-sm font-bold hover:from-amber-600 hover:via-amber-600 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95"
                    >
                        <span>View Details</span>
                        <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onInterest(property);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                        <span>Show Interest</span>
                        <MessageCircle size={16} />
                    </button>
                    {agentWhatsApp && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsApp(e);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                        >
                            <MessageCircle size={16} />
                            <span>WhatsApp Agent</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleShortlist(property);
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                            shortlisted
                                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        <Heart size={16} className={shortlisted ? 'fill-current' : ''} />
                        <span>{shortlisted ? 'Saved ✓' : '♡ Save to Shortlist'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
