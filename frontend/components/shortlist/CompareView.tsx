'use client';

import { Property } from '@/lib/api';
import { MapPin, BedDouble, Bath, Square, Tag, Building2, Sparkles, Calendar, Trash2 } from 'lucide-react';
import { useShortlist } from '@/lib/shortlist';

interface CompareViewProps {
    properties: Property[];
    onRemove?: (propertyId: string) => void;
}

/**
 * CompareView Component
 * Displays properties in a comparison table (desktop) or stacked cards (mobile)
 */
export function CompareView({ properties, onRemove }: CompareViewProps) {
    if (properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Building2 size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium">No properties to compare</p>
                <p className="text-sm mt-2">Add properties to your shortlist to compare them</p>
            </div>
        );
    }

    // Calculate price per sqft helper
    const calculatePricePerSqft = (price: number | null, size: number | null | undefined): string => {
        if (!price || !size || size === 0) return 'N/A';
        const pricePerSqft = Math.round(price / size);
        return `AED ${pricePerSqft.toLocaleString()}`;
    };

    // Format price helper
    const formatPrice = (price: number | null): string => {
        if (!price) return 'Price on request';
        if (price >= 1000000) {
            return `AED ${(price / 1000000).toFixed(1)}M`;
        }
        return `AED ${price.toLocaleString()}`;
    };

    // Get status label
    const getStatusLabel = (status: string | null | undefined): string => {
        if (!status) return 'N/A';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('off-plan') || statusLower.includes('off plan')) {
            return 'Off-Plan';
        } else if (statusLower.includes('ready')) {
            return 'Ready';
        }
        return status;
    };

    // Comparison fields to display
    const comparisonFields = [
        {
            label: 'Image',
            render: (prop: Property) => (
                <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-200">
                    {prop.image_url && prop.image_url.startsWith('http') ? (
                        <img
                            src={prop.image_url}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Building2 size={32} className="text-gray-400" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            label: 'Title',
            render: (prop: Property) => (
                <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                        {prop.title}
                    </h3>
                    {prop.featured && (
                        <div className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full mt-1">
                            <Sparkles size={10} />
                            EXCLUSIVE
                        </div>
                    )}
                </div>
            ),
        },
        {
            label: 'Price (AED)',
            render: (prop: Property) => (
                <div>
                    <p className="font-bold text-xl text-gray-900">{formatPrice(prop.price_aed)}</p>
                    {prop.price_aed && prop.price_aed >= 1000000 && (
                        <p className="text-xs text-gray-500 mt-1">
                            {prop.price_aed.toLocaleString()} AED
                        </p>
                    )}
                </div>
            ),
        },
        {
            label: 'Bedrooms',
            render: (prop: Property) => (
                <div className="flex items-center gap-2">
                    <BedDouble size={18} className="text-gray-600" />
                    <span className="font-semibold text-gray-900">
                        {prop.bedrooms === 0 ? 'Studio' : prop.bedrooms}
                    </span>
                </div>
            ),
        },
        {
            label: 'Bathrooms',
            render: (prop: Property) => (
                <div className="flex items-center gap-2">
                    <Bath size={18} className="text-gray-600" />
                    <span className="font-semibold text-gray-900">
                        {prop.bathrooms || 'N/A'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Size (sqft)',
            render: (prop: Property) => (
                <div className="flex items-center gap-2">
                    <Square size={18} className="text-gray-600" />
                    <span className="font-semibold text-gray-900">
                        {prop.size_sqft ? prop.size_sqft.toLocaleString() : 'N/A'}
                    </span>
                </div>
            ),
        },
        {
            label: 'Price/sqft',
            render: (prop: Property) => (
                <div className="flex items-center gap-2">
                    <Tag size={18} className="text-amber-600" />
                    <span className="font-semibold text-amber-700">
                        {calculatePricePerSqft(prop.price_aed, prop.size_sqft)}
                    </span>
                </div>
            ),
        },
        {
            label: 'Location',
            render: (prop: Property) => (
                <div className="flex items-start gap-2">
                    <MapPin size={18} className="text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-gray-900">{prop.community}</p>
                        {prop.city && prop.city !== prop.community && (
                            <p className="text-sm text-gray-600">{prop.city}</p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            label: 'Property Type',
            render: (prop: Property) => (
                <span className="font-semibold text-gray-900">{prop.property_type}</span>
            ),
        },
        {
            label: 'Status',
            render: (prop: Property) => {
                const status = getStatusLabel(prop.status);
                const isOffPlan = status.toLowerCase().includes('off-plan');
                const isReady = status.toLowerCase().includes('ready');
                return (
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-600" />
                        <span
                            className={`font-semibold px-3 py-1 rounded-full text-xs ${
                                isOffPlan
                                    ? 'bg-blue-100 text-blue-700'
                                    : isReady
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {status}
                        </span>
                    </div>
                );
            },
        },
        {
            label: 'Badges',
            render: (prop: Property) => (
                <div className="flex flex-wrap gap-2">
                    {prop.featured && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles size={10} />
                            EXCLUSIVE
                        </span>
                    )}
                    {prop.cluster_label && (
                        <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            {prop.cluster_label}
                        </span>
                    )}
                    {!prop.featured && !prop.cluster_label && (
                        <span className="text-gray-400 text-sm">-</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="w-full">
            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg overflow-hidden">
                        <thead className="bg-gradient-to-r from-gray-900 to-gray-800">
                            <tr>
                                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider sticky left-0 bg-gray-900 z-10">
                                    Property
                                </th>
                                {properties.map((prop, idx) => (
                                    <th
                                        key={prop.id}
                                        className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[220px] relative"
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="line-clamp-2">{prop.title}</span>
                                            {onRemove && (
                                                <button
                                                    onClick={() => onRemove(prop.id)}
                                                    className="ml-2 p-1 hover:bg-red-500 rounded transition-colors flex-shrink-0"
                                                    title="Remove from comparison"
                                                >
                                                    <Trash2 size={14} className="text-white" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {comparisonFields.map((field, fieldIdx) => (
                                <tr
                                    key={fieldIdx}
                                    className={fieldIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 bg-gray-100 sticky left-0 z-10 border-r border-gray-300">
                                        {field.label}
                                    </td>
                                    {properties.map((prop) => (
                                        <td key={prop.id} className="px-4 py-4 text-sm text-gray-700 border-r border-gray-200">
                                            {field.render(prop)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile: Stacked Cards */}
            <div className="md:hidden space-y-6">
                {properties.map((prop, idx) => (
                    <div
                        key={prop.id}
                        className="border-2 border-gray-200 rounded-xl p-4 bg-white shadow-lg"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-lg text-gray-900 flex-1 pr-2">
                                {prop.title}
                            </h3>
                            {onRemove && (
                                <button
                                    onClick={() => onRemove(prop.id)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Remove from comparison"
                                >
                                    <Trash2 size={18} className="text-red-600" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {comparisonFields.map((field, fieldIdx) => (
                                <div
                                    key={fieldIdx}
                                    className="flex flex-col gap-2 pb-3 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {field.label}
                                    </div>
                                    <div>{field.render(prop)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
