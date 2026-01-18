'use client';

import { useState, useRef, useEffect } from 'react';
import { api, Property } from '@/lib/api';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { PropertyCard } from '@/components/property/PropertyCard';
import { LeadModal } from '@/components/ui/Modal';
import { ShortlistButton } from '@/components/shortlist/ShortlistButton';
import { useToast } from '@/components/ui/Toast';
import { WhatsAppCriteria } from '@/lib/whatsapp';
import { Building2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "👋 **Welcome!** I'm your **Deja Vu Real Estate AI** assistant, powered by live data from PropertyFinder.ae. I can help you find the perfect property in Dubai and across the UAE!\n\n💡 **Try asking:**\n• '2 bed apartment in Downtown under 2M'\n• 'Villa in Palm Jumeirah'\n• 'Studio for rent in Dubai Marina'\n• '3 bedroom ready property in Business Bay'\n\n**What are you looking for?**" }
  ]);
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUserQuery, setLastUserQuery] = useState<string>('');
  const [lastIntent, setLastIntent] = useState<WhatsAppCriteria | undefined>(undefined);
  const [pagination, setPagination] = useState<{ total: number; limit: number; offset: number; has_more: boolean } | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const { showToast, ToastComponent } = useToast();

  // Auto-scroll chat
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Infinite scroll for properties
  const propertiesEndRef = useRef<HTMLDivElement>(null);
  
  // Handle load more (defined before useEffect)
  const handleLoadMore = () => {
    if (!pagination?.has_more || loadingMore || !currentQuery) return;
    handleSend(currentQuery, pagination.offset);
  };

  // Disable infinite scroll temporarily to prevent loop - will re-enable after fixing
  // useEffect(() => {
  //   const observer = new IntersectionObserver(
  //     (entries) => {
  //       if (entries[0].isIntersecting && pagination?.has_more && !loadingMore && !loading && currentQuery) {
  //         handleLoadMore();
  //       }
  //     },
  //     { threshold: 0.1 }
  //   );

  //   const currentRef = propertiesEndRef.current;
  //   if (currentRef) {
  //     observer.observe(currentRef);
  //   }

  //   return () => {
  //     if (currentRef) {
  //       observer.unobserve(currentRef);
  //     }
  //   };
  // }, [pagination, loadingMore, loading, currentQuery]);

  // Load featured properties on mount
  useEffect(() => {
    const loadFeatured = async () => {
      setLoadingFeatured(true);
      setError(null);
      try {
        console.log('[Page] Loading featured properties...');
        const featured = await api.getFeatured();
        console.log('[Page] Loaded featured properties:', featured.length);
        setRecommendations(featured);
      } catch (error: any) {
        console.error('[Page] Failed to load featured properties:', error);
        const errorMessage = error?.response?.status 
          ? `Server error (${error.response.status}). Please check if the backend is running.`
          : error?.code === 'ERR_NETWORK'
          ? 'Network error. Please ensure the backend server is running on http://localhost:8000'
          : 'Failed to load featured properties. Please refresh the page.';
        setError(errorMessage);
      } finally {
        setLoadingFeatured(false);
      }
    };
    // Add a small delay to ensure backend is ready
    const timer = setTimeout(() => {
      loadFeatured();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async (msg: string, offset: number = 0) => {
    // Add User Message (only if it's a new query)
    const isNewQuery = msg !== currentQuery;
    const newMsgs = isNewQuery ? [...messages, { role: 'user', content: msg } as Message] : messages;
    if (isNewQuery) {
      setMessages(newMsgs);
      setCurrentQuery(msg);
      setLoading(true);
      setError(null);
      // Reset recommendations for new query
      setRecommendations([]);
      setPagination(null);
    } else {
      setLoadingMore(true);
    }

    try {
      // API Call with pagination
      const limit = 20;
      const res = await api.sendChat(msg, undefined, limit, offset);

      // Update State
      if (isNewQuery) {
        setMessages([...newMsgs, { role: 'assistant', content: res.text }]);
        setRecommendations(res.recommendations || []);
      } else {
        // Append to existing recommendations
        setRecommendations(prev => [...prev, ...(res.recommendations || [])]);
      }
      
      // Update pagination info
      if (res.pagination) {
        setPagination({
          total: res.pagination.total,
          limit: res.pagination.limit,
          offset: res.pagination.offset + res.pagination.current_count,
          has_more: res.pagination.has_more
        });
      }
      
      // Store user query and intent for WhatsApp context
      if (isNewQuery) {
        setLastUserQuery(msg);
        if (res.intent) {
          setLastIntent({
            query: msg,
            budget: res.intent.max_budget,
            location: res.intent.location,
            bedrooms: res.intent.min_bedrooms,
            property_type: res.intent.property_type,
            status: res.intent.status,
          });
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Sorry, I encountered an error connecting to the server. Please try again.";
      if (isNewQuery) {
        setMessages([...newMsgs, { role: 'assistant', content: errorMessage }]);
      }
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const handleLeadSubmit = async (data: { 
    name: string; 
    contact: string; 
    interest: string;
    email?: string;
    phone?: string;
    message?: string;
    property_id?: string;
  }) => {
    try {
      const response = await api.captureLead(data);
      // Show success message (can be replaced with toast notification component later)
      const message = response?.message || "Request sent successfully!";
      alert(message);
      setSelectedProperty(null);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.detail || "Failed to send request. Please try again.";
      alert(errorMessage);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Navbar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="bg-black text-amber-500 p-1.5 rounded-lg">
            <Building2 size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">DEJA VU <span className="font-light text-gray-500">PROPERTIES AI</span></h1>
        </div>
      </header>

      {/* Main Content: Split View */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Panel: Chat */}
        <div className="w-full md:w-[450px] flex flex-col bg-white border-r border-gray-200 shadow-xl z-0">
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div className="flex gap-2 p-4 text-gray-400 text-sm animate-pulse">
                <Sparkles size={16} /> Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <ChatInput onSend={handleSend} disabled={loading} />
          </div>
        </div>

        {/* Right Panel: Results Grid */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {recommendations.length > 0 ? "Recommended Properties" : "Featured Listings"}
              </h2>
            </div>

            {loadingFeatured ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <Building2 size={48} className="mb-4 opacity-20 animate-pulse" />
                <p className="animate-pulse">Loading featured properties...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <Building2 size={48} className="mb-4 opacity-20" />
                <p>{error || "No properties found. Try adjusting your search criteria."}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      onInterest={setSelectedProperty}
                      userQuery={lastUserQuery}
                      criteria={lastIntent}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {pagination?.has_more && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading more...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Properties</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Pagination Info */}
                {pagination && pagination.total > 0 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing {recommendations.length} of {pagination.total} properties
                  </div>
                )}

                {/* Infinite Scroll Trigger */}
                {pagination?.has_more && (
                  <div ref={propertiesEndRef} className="h-20 flex items-center justify-center">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading more properties...</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Lead Modal */}
      {selectedProperty && (
        <LeadModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onSubmit={handleLeadSubmit}
        />
      )}

      {/* Floating Shortlist Button */}
      <ShortlistButton userQuery={lastUserQuery} criteria={lastIntent} />

      {/* Toast Notification */}
      {ToastComponent}
    </div>
  );
}
