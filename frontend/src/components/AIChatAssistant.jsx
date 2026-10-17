import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { createChatSession } from '../services/geminiService';
const AIChatAssistant = ({ projects, contracts, procurements, user, onNavigate, inspections = [], weeklyPlans = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const initializeChat = () => {
        setMessages([
            { id: Date.now(), text: `Hi ${user?.username || 'there'}! I'm the OWEB AI Assistant. How can I help you today?`, sender: 'ai' }
        ]);
    };
    // Initialize or reset chat when opened or when the user changes.
    // Removed other dependencies to prevent chat from resetting on background data changes.
    useEffect(() => {
        if (isOpen) {
            initializeChat();
        }
    }, [isOpen, user?.username]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    const handleClearChat = () => {
        initializeChat();
    };
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isLoading)
            return;
        const userMessage = { id: Date.now(), text: messageText, sender: 'user' };
        const aiMessagePlaceholder = { id: Date.now() + 1, text: '', sender: 'ai' };
        setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
        setInput('');
        setIsLoading(true);
        try {
            // Create a new session with full portfolio, inspection and weekly tracking context
            const chat = createChatSession({ projects, contracts, procurements, user, inspections, weeklyPlans });
            const stream = await chat.sendMessageStream({ message: messageText });
            for await (const chunk of stream) {
                setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'ai') {
                        // Perform an immutable update on the last message for efficient rendering.
                        newMessages[newMessages.length - 1] = {
                            ...lastMessage,
                            text: lastMessage.text + (chunk.text || '')
                        };
                    }
                    return newMessages;
                });
            }
        }
        catch (error) {
            console.error("AI chat error:", error);
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        text: 'Sorry, something went wrong.'
                    };
                }
                return newMessages;
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const renderMessageContent = (text) => {
        const parts = text.split(/(\[ACTION:.*?\])/g).filter(Boolean);
        return parts.map((part, index) => {
            if (part.startsWith('[ACTION:')) {
                try {
                    const actionJSON = part.replace('[ACTION:', '').slice(0, -1);
                    const action = JSON.parse(actionJSON);
                    const buttonText = `Go to ${action.moduleId} ${action.itemId ? `(${action.itemId.slice(-4)})` : ''}`;
                    return (<button key={index} onClick={() => onNavigate(action.moduleId, action.itemId)} className="inline-block bg-primary text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-opacity-80 ml-2 shadow">
                            {buttonText}
                        </button>);
                }
                catch (e) {
                    return null; // Don't render malformed actions
                }
            }
            return <span key={index}>{part}</span>;
        });
    };
    const suggestionChips = [
        "How many schemes are under ONE WASH and COWASH?",
        "Show active NGO implementing partners",
        "Water quality lab test compliance rate",
        "List staff transferred between programs",
        "Show weekly work plans and S-Curve progress",
        "Check for budget cost overruns",
        "Status of Shashamane project?",
        user?.role === 'Reviewer' ? "What needs my review?" : "Show my active contracts",
    ];
    if (!isOpen) {
        return (<button onClick={() => setIsOpen(true)} className="fixed bottom-8 right-8 bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 text-white w-14 h-14 rounded-2xl shadow-xl shadow-cyan-900/30 flex items-center justify-center hover:scale-105 transition-all transform no-print cursor-pointer ring-4 ring-sky-200/50 hover:ring-sky-300 z-40" aria-label="Open OWEB AI Water Assistant">
                <span className="w-6 h-6">{ICONS.sparkles}</span>
            </button>);
    }
    return (<div className="fixed bottom-8 right-8 w-full max-w-md h-[72vh] bg-white rounded-3xl shadow-2xl shadow-cyan-950/30 flex flex-col z-50 border border-sky-200 no-print animate-fade-in-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#06203c] via-[#072a4d] to-[#041a30] text-white border-b border-cyan-900/60 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-xl shadow-sm text-white">
                        <span className="w-4 h-4 block">{ICONS.sparkles}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">OWEB AI Water Assistant</h3>
                        <p className="text-[10px] text-cyan-300 font-medium">Hydrologic Intelligence &amp; Analytics</p>
                    </div>
                </div>
                <div className="flex items-center space-x-1.5">
                    <button onClick={handleClearChat} className="text-sky-300/80 hover:text-white p-1.5 rounded-lg hover:bg-cyan-900/50 transition-colors cursor-pointer" aria-label="Clear chat" title="Reset Conversation">
                        <span className="w-4 h-4 block">{ICONS.refreshCw}</span>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-sky-300/80 hover:text-white p-1.5 rounded-lg hover:bg-cyan-900/50 text-xl font-bold transition-colors cursor-pointer" aria-label="Close chat">&times;</button>
                </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sky-50/30 custom-scrollbar">
                {messages.map(msg => (<div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && (<div className="w-7 h-7 bg-cyan-100 text-cyan-700 flex items-center justify-center rounded-xl flex-shrink-0 shadow-2xs font-bold text-xs">
                                💧
                            </div>)}
                        <div className={`max-w-xs md:max-w-sm px-4 py-3 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user'
                ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-br-none shadow-xs font-medium'
                : 'bg-white text-slate-800 rounded-bl-none border border-sky-100 shadow-xs'}`}>
                             {isLoading && msg.id === messages[messages.length - 1].id ? (<div className="flex items-center justify-center space-x-1.5 py-1">
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
                                </div>) : (renderMessageContent(msg.text))}
                        </div>
                    </div>))}
                <div ref={messagesEndRef}/>
            </div>
            {/* Input */}
            <div className="p-3.5 border-t border-sky-100 flex-shrink-0 bg-white rounded-b-3xl">
                 <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-1 custom-scrollbar">
                    {suggestionChips.map(suggestion => (<button key={suggestion} onClick={() => handleSendMessage(suggestion)} className="px-2.5 py-1 bg-sky-50 text-cyan-800 text-[11px] font-semibold rounded-lg hover:bg-cyan-100 hover:text-cyan-900 border border-sky-200/60 whitespace-nowrap cursor-pointer transition" disabled={isLoading}>{suggestion}</button>))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} className="flex items-center space-x-2">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about water projects, contracts, QA/QC..." className="w-full px-3.5 py-2.5 bg-slate-50 border border-sky-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-xs font-medium placeholder-slate-400" disabled={isLoading} autoFocus/>
                    <button type="submit" className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white p-2.5 rounded-xl disabled:opacity-50 shrink-0 cursor-pointer shadow-xs" disabled={isLoading || !input.trim()}>
                        <span className="w-4 h-4 block">{ICONS.send}</span>
                    </button>
                </form>
            </div>
        </div>);
};
export default AIChatAssistant;
