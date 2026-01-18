import { X, Mail, Phone, User, MessageSquare, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Property } from '@/lib/api';

interface LeadModalProps {
    property: Property;
    onClose: () => void;
    onSubmit: (data: { name: string; contact: string; interest: string; email?: string; phone?: string; message?: string; property_id?: string }) => void;
}

export function LeadModal({ property, onClose, onSubmit }: LeadModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Use email if provided, otherwise phone, otherwise the contact field
        const contact = email || phone || "";
        
        try {
            await onSubmit({ 
                name, 
                contact,
                email: email || undefined,
                phone: phone || undefined,
                message: message || undefined,
                interest: property.title,
                property_id: property.id
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number | null) => {
        if (!price) return "Price on request";
        if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
        return `AED ${price.toLocaleString()}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-6">
                    {/* Header */}
                <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <Building2 size={20} className="text-amber-700" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Request Information</h2>
                                <p className="text-sm text-gray-500">Get details about this property</p>
                            </div>
                        </div>
                    </div>

                    {/* Property Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">Location:</span> {property.community}, {property.city}
                            </div>
                            <div>
                                <span className="font-medium">Price:</span> {formatPrice(property.price_aed)}
                            </div>
                            <div>
                                <span className="font-medium">Bedrooms:</span> {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} Bed`}
                            </div>
                            {property.property_type && (
                                <div>
                                    <span className="font-medium">Type:</span> {property.property_type}
                                </div>
                            )}
                        </div>
                </div>

                    {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <User size={16} className="text-amber-600" />
                                Full Name *
                            </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Mail size={16} className="text-amber-600" />
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                placeholder="your.email@example.com"
                        />
                    </div>

                    <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <Phone size={16} className="text-amber-600" />
                                Phone Number *
                            </label>
                        <input
                                type="tel"
                            required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            placeholder="+971 50 123 4567"
                        />
                    </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                <MessageSquare size={16} className="text-amber-600" />
                                Additional Message (Optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                                placeholder="Any specific questions or requirements..."
                            />
                        </div>

                    <button
                        type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-amber-600 text-white py-3.5 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl mt-4"
                    >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                    </button>
                        
                        <p className="text-xs text-center text-gray-500 mt-3">
                            🔒 Your information is secure. An agent from <strong>Deja Vu Properties</strong> will contact you within 24 hours.
                    </p>
                </form>
                </div>
            </div>
        </div>
    );
}
