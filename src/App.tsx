/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  MessageSquare, 
  LayoutDashboard, 
  UserCog, 
  GraduationCap,
  Send,
  BarChart3,
  Users,
  Clock,
  Lock,
  ShieldCheck,
  LogIn,
  LogOut,
  AlertCircle,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'chatbot' | 'dashboard' | 'agent';
type Sender = 'User' | 'Bot' | 'Agent';

interface ChatMessage {
  sender: Sender;
  message: string;
  timestamp: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('chatbot');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Shared State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: 'Bot', message: "Welcome to BIET Support! Please select an option from the menu below or type your query.", timestamp: new Date() }
  ]);
  const [confidence, setConfidence] = useState(100);
  const [activeSignals, setActiveSignals] = useState<string[]>([]);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isFreeTextMode, setIsFreeTextMode] = useState(false);

  const navItems = [
    { id: 'chatbot', label: 'Chatbot', icon: MessageSquare },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agent', label: 'Agent Panel', icon: UserCog },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('chatbot');
  };

  // Decision Engine Logic
  const processMessage = (userMsg: string) => {
    const lowerMsg = userMsg.toLowerCase();
    let newConfidence = confidence;
    let newSignals = [...activeSignals];

    // 1. Priority Words (-50)
    const priorityWords = ['fees', 'payment', 'exam', 'results', 'marks', 'certificate'];
    if (priorityWords.some(word => lowerMsg.includes(word))) {
      if (!newSignals.includes("Priority issue detected (-50)")) {
        newConfidence -= 50;
        newSignals.push("Priority issue detected (-50)");
      }
    }

    // 2. Frustration Words (-45)
    const frustrationWords = ['frustrated', 'angry', 'not helpful', 'bad', 'useless'];
    if (frustrationWords.some(word => lowerMsg.includes(word))) {
      if (!newSignals.includes("Frustration detected (-45)")) {
        newConfidence -= 45;
        newSignals.push("Frustration detected (-45)");
      }
    }

    // 3. Repeated Question (-15)
    const lastUserMsg = chatHistory.filter(m => m.sender === 'User').slice(-1)[0];
    if (lastUserMsg && lastUserMsg.message.toLowerCase() === lowerMsg) {
      newConfidence -= 15;
      newSignals.push("Repeated question (-15)");
    }

    // 4. Menu Confusion (-10)
    if (!isFreeTextMode && !['1','2','3','4','5','6','7'].includes(lowerMsg)) {
      newConfidence -= 10;
      newSignals.push("Menu confusion (-10)");
    }

    // 5. Free Text Mode (-5)
    if (lowerMsg === '7' && !isFreeTextMode) {
      newConfidence -= 5;
      newSignals.push("Free text mode (-5)");
      setIsFreeTextMode(true);
    }

    // Scenario: Payment Issue Demo
    const hasPaidFeeIssue = lowerMsg.includes("paid fee") && lowerMsg.includes("not updated");
    const hasRepeatPaidFeeIssue = lowerMsg.includes("already paid") && lowerMsg.includes("not showing");
    
    if (hasPaidFeeIssue) {
      if (!newSignals.includes("Payment issue (-20)")) {
        newConfidence -= 20;
        newSignals.push("Payment issue (-20)");
      }
    }

    if (hasRepeatPaidFeeIssue) {
      const previouslyHadFeeIssue = activeSignals.includes("Payment issue (-20)");
      if (previouslyHadFeeIssue) {
        newConfidence = 30; // Force escalation
        newSignals.push("Repeated payment issue (-70)");
      }
    }

    // Update State
    setConfidence(Math.max(0, newConfidence));
    setActiveSignals(newSignals);

    // Escalation Check
    if (newConfidence < 40 && !isEscalated) {
      setIsEscalated(true);
      const escalationMsg: ChatMessage = {
        sender: 'Bot',
        message: "I am unable to resolve this issue automatically. Connecting you to a human support agent.",
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, { sender: 'User', message: userMsg, timestamp: new Date() }, escalationMsg]);
      return true; // Escalated
    }

    return false; // Not escalated
  };

  const addMessage = (sender: Sender, message: string) => {
    const newMsg: ChatMessage = { sender, message, timestamp: new Date() };
    setChatHistory(prev => [...prev, newMsg]);

    if (sender === 'User' && !isEscalated) {
      const escalated = processMessage(message);
      if (!escalated) {
        // Simple Bot Logic
        setTimeout(() => {
          let botReply = "I'm sorry, I didn't quite catch that. Could you please rephrase or select a menu option?";
          const lowerMsg = message.toLowerCase();

          if (lowerMsg === '1') botReply = "Exam schedules are available on the student portal under the 'Exams' tab.";
          else if (lowerMsg === '2') botReply = "Results and memos for the current semester will be released by next week.";
          else if (lowerMsg === '3') botReply = "Our placement cell is currently hosting drives for top tech companies. Check your email for details.";
          else if (lowerMsg === '4') botReply = "Academic calendars and fee structures are posted on the BIET official website.";
          else if (lowerMsg === '5') botReply = "You can contact the college office at office@biet.ac.in or call 040-12345678.";
          else if (lowerMsg === '6') {
            setIsEscalated(true);
            botReply = "Connecting you to a human support agent...";
          }
          else if (lowerMsg === '7') botReply = "Free-text mode enabled. How can I assist you further?";
          else if (lowerMsg.includes("paid fee") && lowerMsg.includes("not updated")) {
            botReply = "Fee payment updates may take 1–2 working days.";
          }

          setChatHistory(prev => [...prev, { sender: 'Bot', message: botReply, timestamp: new Date() }]);
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                BIET Support
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === item.id
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium ${
                      currentView === item.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (isAuthenticated ? '-auth' : '-unauth')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {currentView === 'chatbot' && (
              <ChatbotView 
                chatHistory={chatHistory} 
                addMessage={addMessage} 
                isEscalated={isEscalated}
                isFreeTextMode={isFreeTextMode}
              />
            )}
            {currentView === 'dashboard' && (
              <DashboardView 
                confidence={confidence} 
                activeSignals={activeSignals} 
              />
            )}
            {currentView === 'agent' && (
              isAuthenticated ? (
                <AgentPanelView 
                  chatHistory={chatHistory} 
                  addMessage={addMessage} 
                  isEscalated={isEscalated} 
                />
              ) : (
                <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Bharat Institute of Engineering and Technology. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function ChatbotView({ chatHistory, addMessage, isEscalated, isFreeTextMode }: { 
  chatHistory: ChatMessage[], 
  addMessage: (sender: Sender, message: string) => void,
  isEscalated: boolean,
  isFreeTextMode: boolean
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const menuOptions = [
    "1. Exam Information",
    "2. Results / Memos",
    "3. Placement Support",
    "4. Fees & Academics",
    "5. Contact College Office",
    "6. Talk to Human Agent",
    "7. Other (Free Text Support)"
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[650px]">
        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-indigo-200 shadow-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight">BIET Support Bot</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isEscalated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {isEscalated ? 'Human Agent Connected' : 'Automated Support'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50 scroll-smooth">
          {chatHistory.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex gap-3 ${msg.sender === 'User' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.sender === 'User' ? 'bg-indigo-600' : 'bg-white border border-slate-200'
              }`}>
                {msg.sender === 'User' ? (
                  <Users className="w-4 h-4 text-white" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                )}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm max-w-[85%] border ${
                msg.sender === 'User' 
                  ? 'bg-indigo-600 rounded-tr-none border-indigo-500 text-white'
                  : 'bg-white rounded-tl-none border-slate-200 text-slate-700' 
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            </motion.div>
          ))}

          {!isEscalated && !isFreeTextMode && chatHistory.length === 1 && (
            <div className="pt-4 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Menu Options</p>
              <div className="grid grid-cols-1 gap-2">
                {menuOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => addMessage('User', (i + 1).toString())}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm text-left flex items-center justify-between group"
                  >
                    {opt}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (addMessage('User', input), setInput(''))}
              placeholder={isEscalated ? "Chat with agent..." : "Type your message..."}
              className="w-full pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <button 
              onClick={() => { addMessage('User', input); setInput(''); }}
              disabled={!input.trim()}
              className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:bg-slate-200 shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ confidence, activeSignals }: { confidence: number, activeSignals: string[] }) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Automation Confidence</h3>
            <div className={`p-2 rounded-xl ${confidence < 40 ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <TrendingDown className={`w-6 h-6 ${confidence < 40 ? 'text-red-600' : 'text-emerald-600'}`} />
            </div>
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-4 items-center justify-between">
              <div>
                <span className={`text-xs font-bold inline-block py-1 px-2 uppercase rounded-full ${
                  confidence < 40 ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100'
                }`}>
                  {confidence < 40 ? 'Escalated' : 'Stable'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900">{confidence}%</span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-slate-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                  confidence < 40 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            Confidence score determines when to escalate the conversation to a human agent.
          </p>
        </div>

        {/* Active Signals Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2 rounded-xl">
              <AlertCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Active Signals</h3>
          </div>
          
          <div className="space-y-3">
            {activeSignals.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No negative signals detected yet.</p>
            ) : (
              activeSignals.map((signal, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-slate-700">{signal}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-2xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-bold mb-2">Hybrid Engine Status</h4>
            <p className="text-indigo-200 text-sm max-w-md">
              The decision engine is currently monitoring chat interactions in real-time. 
              {confidence < 40 
                ? " Escalation has been triggered due to low confidence." 
                : " Automation is handling the current load efficiently."}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{activeSignals.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-indigo-300">Signals</p>
            </div>
            <div className="w-px h-12 bg-indigo-700" />
            <div className="text-center">
              <p className="text-3xl font-bold">{confidence < 40 ? 'OFF' : 'ON'}</p>
              <p className="text-[10px] uppercase tracking-widest text-indigo-300">Auto-Pilot</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentPanelView({ chatHistory, addMessage, isEscalated }: { 
  chatHistory: ChatMessage[], 
  addMessage: (sender: Sender, message: string) => void,
  isEscalated: boolean
}) {
  const [reply, setReply] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Left Column: Chat Monitor */}
      <div className="lg:col-span-2 flex flex-col h-[700px]">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Live Chat Monitor</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Monitoring Student Interaction
                </p>
              </div>
            </div>
            {isEscalated && (
              <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-full animate-pulse">
                Action Required
              </span>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === 'User' ? 'items-start' : 'items-end'}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1 px-2">
                  {msg.sender} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`p-3 rounded-xl shadow-sm max-w-[80%] border ${
                  msg.sender === 'User' 
                    ? 'bg-white border-slate-200 text-slate-700' 
                    : msg.sender === 'Bot'
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {isEscalated && (
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (addMessage('Agent', reply), setReply(''))}
                  placeholder="Type your response as a human agent..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                />
                <button 
                  onClick={() => { addMessage('Agent', reply); setReply(''); }}
                  disabled={!reply.trim()}
                  className="px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:bg-slate-200 shadow-lg shadow-emerald-100 font-bold text-sm"
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Agent Info */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900">Agent Status</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <span className="text-sm text-slate-600">Availability</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">ONLINE</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <span className="text-sm text-slate-600">Active Escalations</span>
              <span className="text-sm font-black text-slate-900">{isEscalated ? '1' : '0'}</span>
            </div>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              Go Offline
            </button>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
          <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Agent Instructions
          </h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            When a conversation is escalated, review the chat history to understand the student's frustration. 
            Provide personalized support and resolve priority issues immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginView({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulated Login
    setTimeout(() => {
      if (username && password) {
        onLoginSuccess();
      } else {
        setError('Invalid credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Agent Login</h2>
          <p className="text-slate-500 text-sm mt-2">Access the BIET Support Agent Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-xs font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:bg-slate-300 active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium italic">
            Authorized personnel only. All access is logged.
          </p>
        </div>
      </div>
    </div>
  );
}
