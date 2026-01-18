'use client';

import { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';

interface PropertyMapProps {
    address: string;
    community: string;
    city: string;
    propertyTitle?: string;
}

export function PropertyMap({ address, community, city, propertyTitle }: PropertyMapProps) {
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(false);
    
    // Construct search query for Google Maps
    const searchQuery = `${community}, ${city}, UAE`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Google Maps Embed URL (no API key required for basic embed)
    const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodedQuery}`;
    
    // Fallback: Google Maps search URL
    const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    
    // Check if we have API key
    const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    useEffect(() => {
        // Set timeout to show loading state briefly for better UX
        const timer = setTimeout(() => {
            setMapLoaded(true);
        }, 500);
        
        return () => clearTimeout(timer);
    }, []);

    const handleMapClick = () => {
        window.open(googleMapsSearchUrl, '_blank');
    };

    if (mapError && !hasApiKey) {
        // Fallback UI when no API key
        return (
            <div className="relative bg-gradient-to-br from-gray-100 via-gray-150 to-gray-200 rounded-2xl aspect-video border-2 border-gray-300 overflow-hidden group">
                {/* Pattern overlay */}
                <div 
                    className="absolute inset-0 opacity-10" 
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px'
                    }} 
                />
                
                {/* Clickable overlay */}
                <button
                    onClick={handleMapClick}
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 group/button hover:bg-black/5 transition-colors"
                >
                    <div className="text-center text-gray-700 relative z-20 transform group-hover/button:scale-110 transition-transform">
                        <div className="relative mb-4">
                            <MapPin size={64} className="mx-auto text-amber-600 mb-2 drop-shadow-lg" />
                            <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-50 animate-pulse" />
                        </div>
                        <p className="text-xl font-bold mb-2">{community}</p>
                        <p className="text-base text-gray-600 mb-1">{city}, UAE</p>
                        <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold mt-4 group-hover/button:text-amber-700">
                            <span>View on Google Maps</span>
                            <ExternalLink size={16} className="group-hover/button:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="relative bg-white rounded-2xl aspect-video border-2 border-gray-300 overflow-hidden shadow-xl">
            {hasApiKey ? (
                <>
                    {!mapLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center z-20">
                            <div className="text-center">
                                <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">Loading map...</p>
                            </div>
                        </div>
                    )}
                    
                    <iframe
                        src={googleMapsEmbedUrl}
                        className={`w-full h-full border-0 transition-opacity duration-500 ${
                            mapLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        onLoad={() => setMapLoaded(true)}
                        onError={() => {
                            setMapError(true);
                            setMapLoaded(false);
                        }}
                        title={`Map showing ${community}, ${city}`}
                    />
                    
                    {/* Overlay button to open in new tab */}
                    <button
                        onClick={handleMapClick}
                        className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-lg font-semibold text-sm flex items-center gap-2 transition-all duration-200 hover:shadow-xl transform hover:-translate-y-0.5 z-10 border border-gray-200"
                        title="Open in Google Maps"
                    >
                        <ExternalLink size={16} />
                        <span>Open in Maps</span>
                    </button>
                    
                    {/* Location marker indicator */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-amber-600" />
                            <div>
                                <p className="text-sm font-bold text-gray-900">{community}</p>
                                <p className="text-xs text-gray-600">{city}, UAE</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // Fallback when no API key
                <div className="relative bg-gradient-to-br from-gray-100 via-gray-150 to-gray-200 h-full flex items-center justify-center group">
                    {/* Pattern overlay */}
                    <div 
                        className="absolute inset-0 opacity-10" 
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundSize: '60px 60px'
                        }} 
                    />
                    
                    {/* Clickable overlay */}
                    <button
                        onClick={handleMapClick}
                        className="absolute inset-0 flex flex-col items-center justify-center z-10 group/button hover:bg-black/5 transition-colors"
                    >
                        <div className="text-center text-gray-700 relative z-20 transform group-hover/button:scale-110 transition-transform">
                            <div className="relative mb-4">
                                <MapPin size={64} className="mx-auto text-amber-600 mb-2 drop-shadow-lg" />
                                <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-50 animate-pulse" />
                            </div>
                            <p className="text-xl font-bold mb-2">{community}</p>
                            <p className="text-base text-gray-600 mb-1">{city}, UAE</p>
                            <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold mt-4 group-hover/button:text-amber-700">
                                <span>View on Google Maps</span>
                                <ExternalLink size={16} className="group-hover/button:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                    
                    {/* Info badge */}
                    <div className="absolute top-4 right-4 bg-amber-50 border-2 border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg shadow-md text-xs font-semibold z-20">
                        <span>📍 Interactive Map Available</span>
                    </div>
                </div>
            )}
        </div>
    );
}
