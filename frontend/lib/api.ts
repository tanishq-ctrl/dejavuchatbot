import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Configure axios defaults
axios.defaults.timeout = 30000; // 30 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
    (response) => {
        console.log(`[API] Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('[API] Response error:', {
            message: error.message,
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export interface ScoreBreakdownItem {
    factor: string;
    weight: number;
    value: string;
    points: number;
    explanation: string;
}

export interface Property {
    id: string;
    title: string;
    price_aed: number | null;
    community: string;
    city: string;
    property_type: string;
    bedrooms: number;
    bathrooms?: number | null;
    size_sqft?: number | null;
    status?: string | null;
    image_url: string | null;
    featured: boolean;
    cluster_label?: string | null;
    match_reasons: string[];
    // Transparent scoring fields
    match_score?: number | null;
    score_breakdown?: ScoreBreakdownItem[];
    top_reasons?: string[];
}

export interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    current_count: number;
}

export interface ChatResponse {
    text: string;
    recommendations: Property[];
    intent: any;
    pagination?: PaginationInfo;
}

export const api = {
    async sendChat(message: string, sessionId?: string, limit?: number, offset?: number): Promise<ChatResponse> {
        const res = await axios.post<ChatResponse>(`${API_URL}/chat`, {
            message,
            session_id: sessionId,
            limit: limit || 20,
            offset: offset || 0
        });
        return res.data;
    },

    async captureLead(data: { 
        name: string; 
        contact: string; 
        interest: string;
        email?: string;
        phone?: string;
        message?: string;
        property_id?: string;
    }) {
        const res = await axios.post(`${API_URL}/lead`, data);
        return res.data;
    },

    async getFeatured(): Promise<Property[]> {
        const res = await axios.get<Property[]>(`${API_URL}/featured`);
        return res.data;
    },

    async getProperty(id: string): Promise<Property> {
        const res = await axios.get<Property>(`${API_URL}/properties/${id}`);
        return res.data;
    },

    // Shortlist endpoints
    async shareShortlist(propertyIds: string[]): Promise<{ share_id: string; share_url: string }> {
        const res = await axios.post<{ share_id: string; share_url: string }>(`${API_URL}/shortlist/share`, {
            property_ids: propertyIds
        });
        return res.data;
    },

    async getSharedShortlist(shareId: string): Promise<Property[]> {
        const res = await axios.get<Property[]>(`${API_URL}/shortlist/share/${shareId}`);
        return res.data;
    }
};
