import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, X, Bot, AlertTriangle, Sparkles } from 'lucide-react';
import './AIChatbot.css';

// Simple parser to render basic markdown safely (bold, bullet points, numbered lists, line breaks)
const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Bold: **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bold alternative: *text* (if used for bold)
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');

  const lines = escaped.split('\n');
  let inList = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Bullet points: - item or * item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        result.push('<ul class="chat-list">');
        inList = true;
      }
      result.push(`<li>${line.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      
      if (line === '') {
        result.push('<div class="chat-spacer"></div>');
      } else {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('');
};

const AIChatbot = () => {
  const { user, token, API_URL } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hii! Main aapka Pickleball Tournament Assistant hoon. 🏓\n\nAap mujhse is tournament ke schedule, standings, match scores, ya rules ke baare mein kuch bhi puch sakte hain. Kaise madad karu aapki?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Extract tournament ID if user is on a tournament detail page
  const pathParts = location.pathname.split('/');
  const tournamentId = pathParts[1] === 'tournaments' ? pathParts[2] : null;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // If user logs out, clear chat history and close
  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      setMessages([
        {
          role: 'assistant',
          content: 'Hii! Main aapka Pickleball Tournament Assistant hoon. 🏓\n\nAap mujhse is tournament ke schedule, standings, match scores, ya rules ke baare mein kuch bhi puch sakte hain. Kaise madad karu aapki?'
        }
      ]);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');
    
    // Add user message to state
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Map message history to what backend expects (role: user/assistant, content: string)
      const chatHistory = newMessages.slice(0, -1); // Exclude the latest user message because backend takes it as 'message' parameter
      
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: userMessage,
          tournamentId: tournamentId,
          chatHistory: chatHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.setupRequired) {
          setError('Gemini API Key missing in backend .env file. Please check settings.');
        } else {
          throw new Error(data.message || 'Failed to get response from assistant');
        }
        return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to the AI Server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chatbot-container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button className="ai-fab-btn" onClick={() => setIsOpen(true)} title="Ask Assistant">
          <Sparkles className="fab-icon-sparkle" size={16} />
          <Bot className="fab-icon-bot" size={24} />
          <span className="fab-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-header-title">
              <Bot className="ai-header-icon" size={20} />
              <div>
                <h4>CourtAI Assistant</h4>
                <p>{tournamentId ? 'Tournament Context Active' : 'General Assistant'}</p>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="ai-messages-area">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message-row ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-avatar">
                    <Bot size={14} />
                  </div>
                )}
                <div 
                  className={`ai-message-bubble ${msg.role}`}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
              </div>
            ))}
            
            {loading && (
              <div className="ai-message-row assistant">
                <div className="ai-avatar">
                  <Bot size={14} />
                </div>
                <div className="ai-message-bubble assistant loading">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="ai-error-banner">
                <AlertTriangle size={16} className="error-icon" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="ai-input-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask anything about the tournament..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!input.trim() || loading} className="ai-send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
