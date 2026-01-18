import React from 'react';
import { cn } from "@/lib/utils";
import { User, Bot } from 'lucide-react';

interface ChatBubbleProps {
    role: 'user' | 'assistant';
    content: string;
}

// Simple markdown parser for bold and line breaks
function parseMarkdown(text: string): React.ReactNode {
    // Split by double line breaks for paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, pIdx) => {
        // Handle line breaks within paragraphs
        const lines = paragraph.split('\n');
        
        return (
            <p key={pIdx} className={pIdx > 0 ? "mt-3" : ""}>
                {lines.map((line, lIdx) => (
                    <span key={lIdx}>
                        {parseBoldAndItalic(line)}
                        {lIdx < lines.length - 1 && <br />}
                    </span>
                ))}
            </p>
        );
    });
}

// Parse **bold** and *italic* markdown
function parseBoldAndItalic(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Match **bold** or *italic*
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let match;
    let lastIndex = 0;
    
    while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        
        // Add formatted text
        if (match[1].startsWith('**')) {
            // Bold
            parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-gray-900">{match[2]}</strong>);
        } else {
            // Italic
            parts.push(<em key={`italic-${match.index}`} className="italic">{match[1].slice(1, -1)}</em>);
        }
        
        lastIndex = regex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
    const isUser = role === 'user';

    return (
        <div className={cn("flex gap-3 mb-4", isUser ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isUser ? "bg-amber-600 text-white" : "bg-zinc-800 text-white"
            )}>
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
                "p-3 rounded-lg max-w-[80%] text-sm leading-relaxed whitespace-pre-wrap",
                isUser ? "bg-amber-50/50 border border-amber-100 text-amber-900"
                    : "bg-white border border-gray-100 shadow-sm text-gray-700"
            )}>
                {parseMarkdown(content)}
            </div>
        </div>
    );
}
