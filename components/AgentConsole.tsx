import React, { useState, useRef, useEffect } from 'react';
import { Agent, Message } from '../types';
import { Send, Bot, User, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { queryAgent } from '../geminiService';

interface AgentConsoleProps {
  agents: Agent[];
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ agents }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'Supervisor',
      text: 'Welcome to the Sierra Home Pros AI Desk. Ask me to draft a written estimate for a handyman visit, sequence a Reno–Sparks–Tahoe route, or prepare a senior home-safety checklist.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent>(
    agents.find(a => a.role === 'Supervisor') || agents[0]
  );
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const promptText = (customText ?? input).trim();
    if (!promptText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const aiResponse = await queryAgent(selectedAgent.role, promptText);

    const agentMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: selectedAgent.role,
      text: aiResponse || 'I could not process that request right now. Please try again.',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, agentMessage]);
    setIsTyping(false);
  };

  const quickPrompts = [
    'Draft a written estimate for installing 3 bathroom ADA grab bars and a threshold ramp in Reno',
    'Create a winter home maintenance checklist for a Carson City homeowner',
    'Plan a 1-day smart thermostat, video doorbell, and 2 smart lock install in Sparks'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <Bot className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 leading-tight">Sierra Home Pros AI Desk</h3>
            <p className="text-xs text-zinc-400">Estimating, dispatch routing & senior safety support</p>
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-200 whitespace-nowrap">
            <Sparkles size={14} className="text-emerald-400" />
            <span>{selectedAgent.name}</span>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-2 space-y-1">
              {agents.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAgent(a)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors ${
                    selectedAgent.id === a.id
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'hover:bg-zinc-900 text-zinc-300'
                  }`}
                >
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{a.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.sender === 'user'
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              }`}>
                {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-tl-none'
              }`}>
                {msg.sender !== 'user' && (
                  <p className="text-[11px] font-semibold text-emerald-400 mb-1">
                    {selectedAgent.name}
                  </p>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <p className="text-[11px] opacity-60 mt-2 font-mono tabular-nums">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Loader2 size={15} className="text-emerald-400 animate-spin" />
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 text-xs">
                {selectedAgent.name} is drafting a response...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pt-3 pb-5 bg-zinc-950 border-t border-zinc-800 space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors text-left"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask ${selectedAgent.name} about estimates, routes, or home repairs...`}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-zinc-100 placeholder-zinc-500"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 p-3.5 rounded-xl transition-colors text-white"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentConsole;
