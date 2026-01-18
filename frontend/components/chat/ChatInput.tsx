import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
    onSend: (msg: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [msg, setMsg] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (msg.trim() && !disabled) {
            onSend(msg);
            setMsg("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Ask about properties (e.g., '2 bed in Downtown')..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-sm"
                disabled={disabled}
            />
            <button
                type="submit"
                disabled={!msg.trim() || disabled}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <SendHorizontal size={18} />
            </button>
        </form>
    );
}
