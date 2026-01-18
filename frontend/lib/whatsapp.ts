import { Property } from './api';

/**
 * WhatsApp Handoff Utility
 * Builds WhatsApp click-to-chat links with prefilled messages
 */

export interface WhatsAppCriteria {
    query?: string;
    budget?: number;
    location?: string;
    bedrooms?: number;
    property_type?: string;
    status?: string;
}

export interface WhatsAppContact {
    email?: string;
    phone?: string;
}

/**
 * Build a WhatsApp message for property inquiry
 */
export function buildWhatsAppMessage({
    query,
    criteria,
    properties,
    contact,
}: {
    query?: string;
    criteria?: WhatsAppCriteria;
    properties: Property[];
    contact?: WhatsAppContact;
}): string {
    const parts: string[] = [];

    // Start with greeting
    parts.push("Hi XYZ Properties team, I'm interested in the following options:");

    // Add user criteria if available
    const criteriaParts: string[] = [];
    if (query) {
        criteriaParts.push(`Query: ${query}`);
    }
    if (criteria?.location) {
        criteriaParts.push(`Location: ${criteria.location}`);
    }
    if (criteria?.bedrooms !== undefined) {
        criteriaParts.push(`${criteria.bedrooms === 0 ? 'Studio' : `${criteria.bedrooms} Bed`}`);
    }
    if (criteria?.property_type) {
        criteriaParts.push(criteria.property_type);
    }
    if (criteria?.budget) {
        const budgetM = criteria.budget / 1000000;
        criteriaParts.push(`Budget: AED ${budgetM >= 1 ? `${budgetM.toFixed(1)}M` : criteria.budget.toLocaleString()}`);
    }
    if (criteria?.status) {
        const statusLabel = criteria.status.toLowerCase().includes('off-plan') || criteria.status.toLowerCase().includes('off plan')
            ? 'Off-plan'
            : criteria.status.toLowerCase().includes('ready')
            ? 'Ready'
            : criteria.status;
        criteriaParts.push(statusLabel);
    }

    if (criteriaParts.length > 0) {
        parts.push(`\nCriteria: ${criteriaParts.join(', ')}`);
    }

    // Add property list (max 5, or truncate if too long)
    if (properties.length > 0) {
        parts.push(`\nProperties (${properties.length}):`);
        
        const maxProperties = 5;
        const propertiesToInclude = properties.slice(0, maxProperties);
        
        propertiesToInclude.forEach((prop, idx) => {
            const propLines: string[] = [];
            
            // Title and community
            propLines.push(`${idx + 1}. ${prop.title} - ${prop.community}`);
            
            // Price
            if (prop.price_aed) {
                const price = prop.price_aed >= 1000000
                    ? `AED ${(prop.price_aed / 1000000).toFixed(1)}M`
                    : `AED ${prop.price_aed.toLocaleString()}`;
                propLines.push(`   Price: ${price}`);
            }
            
            // Beds/Baths/Size
            const specs: string[] = [];
            if (prop.bedrooms !== undefined) {
                specs.push(prop.bedrooms === 0 ? 'Studio' : `${prop.bedrooms} Bed`);
            }
            if (prop.bathrooms) {
                specs.push(`${prop.bathrooms} Bath`);
            }
            if (prop.size_sqft) {
                specs.push(`${prop.size_sqft.toLocaleString()} sqft`);
            }
            if (specs.length > 0) {
                propLines.push(`   ${specs.join(' | ')}`);
            }
            
            // Property ID
            propLines.push(`   ID: ${prop.id}`);
            
            parts.push(propLines.join('\n'));
        });
        
        if (properties.length > maxProperties) {
            parts.push(`\n... and ${properties.length - maxProperties} more`);
        }
    }

    // Add contact info if available
    if (contact?.email || contact?.phone) {
        const contactParts: string[] = [];
        if (contact.email) contactParts.push(`Email: ${contact.email}`);
        if (contact.phone) contactParts.push(`Phone: ${contact.phone}`);
        parts.push(`\nPreferred contact: ${contactParts.join(', ')}`);
    }

    // End with CTA
    parts.push("\nPlease share availability and next steps.");

    let message = parts.join('\n');

    // Truncate if too long (max ~900 characters for WhatsApp)
    const maxLength = 900;
    if (message.length > maxLength) {
        // Try to truncate property list first
        const truncationPoint = message.substring(0, maxLength - 50).lastIndexOf('\n');
        if (truncationPoint > 0) {
            message = message.substring(0, truncationPoint) + '\n\n... (message truncated)';
        } else {
            message = message.substring(0, maxLength - 50) + '... (message truncated)';
        }
    }

    return message;
}

/**
 * Get WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(message: string, phoneNumber?: string): string | null {
    if (!phoneNumber) {
        return null;
    }

    // Remove any non-digit characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (!cleanPhone) {
        return null;
    }

    // URL encode the message
    const encodedMessage = encodeURIComponent(message);

    // Build WhatsApp URL: https://wa.me/<PHONE>?text=<MESSAGE>
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Get agent WhatsApp phone number from environment
 * Note: In Next.js, NEXT_PUBLIC_* variables are available in client-side code
 */
export function getAgentWhatsApp(): string | undefined {
    // Access env var directly (Next.js makes NEXT_PUBLIC_* available in browser)
    const phone = process.env.NEXT_PUBLIC_AGENT_WHATSAPP;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
        console.log('[WhatsApp] Env var loaded:', phone ? `YES (${phone})` : 'NO - Check .env.local');
    }
    
    return phone || undefined;
}

/**
 * Open WhatsApp with prefilled message
 */
export function openWhatsApp(message: string, phoneNumber?: string): boolean {
    if (!phoneNumber) {
        console.error('[WhatsApp] Phone number not provided');
        alert('WhatsApp number not configured. Please set NEXT_PUBLIC_AGENT_WHATSAPP in .env.local');
        return false;
    }

    const url = getWhatsAppUrl(message, phoneNumber);
    if (!url) {
        console.error('[WhatsApp] Failed to generate WhatsApp URL');
        alert('Failed to generate WhatsApp URL. Please check console for details.');
        return false;
    }

    // Debug logging
    console.log('[WhatsApp] ===== DEBUG INFO =====');
    console.log('[WhatsApp] Phone number:', phoneNumber);
    console.log('[WhatsApp] Message length:', message.length, 'chars');
    console.log('[WhatsApp] Message preview:', message.substring(0, 150) + '...');
    console.log('[WhatsApp] Full URL:', url);
    console.log('[WhatsApp] URL length:', url.length, 'chars');
    console.log('[WhatsApp] ======================');

    // Check URL length limit (WhatsApp has ~4096 char limit, but we'll be conservative)
    if (url.length > 4000) {
        console.warn('[WhatsApp] URL is very long, may not work properly');
    }

    // Try to open WhatsApp - use multiple methods to bypass popup blockers
    try {
        console.log('[WhatsApp] Attempting to open WhatsApp...');
        
        // Method 1: Create and click an anchor element (most reliable, bypasses popup blockers)
        // This works because it's seen as a user-initiated navigation
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        link.setAttribute('aria-hidden', 'true');
        document.body.appendChild(link);
        
        // Trigger click programmatically
        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            buttons: 1
        });
        link.dispatchEvent(clickEvent);
        
        // Clean up after a short delay
        setTimeout(() => {
            if (document.body.contains(link)) {
                document.body.removeChild(link);
            }
        }, 100);
        
        console.log('[WhatsApp] Opened WhatsApp using anchor click method');
        
        // Also try window.open as backup (in case anchor method doesn't work)
        setTimeout(() => {
            try {
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.location.href = url;
                }
            } catch (e) {
                // Silently fail if window.open is blocked
            }
        }, 50);
        
        return true;
        
    } catch (error) {
        console.error('[WhatsApp] Error with anchor method:', error);
        
        // Method 2: Fallback to window.open
        try {
            console.log('[WhatsApp] Trying window.open as fallback...');
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            
            // Check if popup was blocked
            if (!newWindow || newWindow.closed === true || typeof newWindow.closed === 'undefined') {
                console.warn('[WhatsApp] Popup blocked! Using same-tab redirect...');
                // Method 3: Last resort - redirect in same tab
                window.location.href = url;
                return true;
            }
            
            console.log('[WhatsApp] Opened WhatsApp using window.open');
            return true;
        } catch (windowOpenError) {
            console.error('[WhatsApp] window.open also failed:', windowOpenError);
            
            // Final fallback: redirect in same tab
            try {
                console.log('[WhatsApp] Final fallback: redirecting in same tab');
                window.location.href = url;
                return true;
            } catch (finalError) {
                console.error('[WhatsApp] All methods failed:', finalError);
                // Show URL to user so they can manually copy
                const userConfirmed = confirm(`Failed to open WhatsApp automatically.\n\nWould you like to be redirected to WhatsApp now?\n\n(Cancel to copy URL manually)`);
                if (userConfirmed) {
                    window.location.href = url;
                } else {
                    // Copy URL to clipboard
                    navigator.clipboard.writeText(url).then(() => {
                        alert(`URL copied to clipboard!\n\n${url.substring(0, 80)}...`);
                    }).catch(() => {
                        alert(`Please copy this URL manually:\n\n${url}`);
                    });
                }
                return false;
            }
        }
    }
}
