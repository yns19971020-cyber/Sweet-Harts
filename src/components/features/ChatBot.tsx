import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const startNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Support Chat' }),
      });
      const data = await response.json();
      setConversation(data);
      setMessages([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    if (!conversation) {
      await startNewConversation();
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversation || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              }
              if (data.done) {
                setMessages(prev => [
                  ...prev,
                  { id: Date.now() + 1, role: 'assistant', content: fullResponse },
                ]);
                setStreamingMessage('');
              }
            } catch (e) {
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-2xl hover:scale-110"
          title="Chat with AI Support"
        >
          💬
        </button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] flex flex-col shadow-2xl border-2 border-pink-200 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💕</span>
              <div>
                <h3 className="font-bold text-white">Sweet Hearts Support</h3>
                <p className="text-xs text-pink-100">AI Assistant</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConversation(null);
                  setMessages([]);
                  startNewConversation();
                }}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="New Chat"
              >
                🔄
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-pink-50 to-white">
            {messages.length === 0 && !streamingMessage && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💬</div>
                <h4 className="font-semibold text-gray-700 mb-2">Welcome to Sweet Hearts!</h4>
                <p className="text-sm text-gray-500 mb-4">
                  How can I help you today? Ask me about:
                </p>
                <div className="space-y-2 text-sm text-left max-w-[280px] mx-auto">
                  <button
                    onClick={() => {
                      setInputValue('How do I register?');
                      inputRef.current?.focus();
                    }}
                    className="w-full p-2 bg-white rounded-lg border border-pink-200 hover:border-pink-400 text-left transition-colors"
                  >
                    📝 How do I register?
                  </button>
                  <button
                    onClick={() => {
                      setInputValue('How do WhatsApp unlocks work?');
                      inputRef.current?.focus();
                    }}
                    className="w-full p-2 bg-white rounded-lg border border-pink-200 hover:border-pink-400 text-left transition-colors"
                  >
                    📱 How do WhatsApp unlocks work?
                  </button>
                  <button
                    onClick={() => {
                      setInputValue('What subscription plans are available?');
                      inputRef.current?.focus();
                    }}
                    className="w-full p-2 bg-white rounded-lg border border-pink-200 hover:border-pink-400 text-left transition-colors"
                  >
                    💎 Subscription plans?
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-br-md'
                        : 'bg-white border border-pink-100 text-gray-700 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-3 rounded-2xl rounded-bl-md bg-white border border-pink-100 text-gray-700 shadow-sm text-sm">
                    <p className="whitespace-pre-wrap">{streamingMessage}</p>
                    <span className="inline-block w-2 h-4 bg-pink-500 animate-pulse ml-1"></span>
                  </div>
                </div>
              )}

              {isLoading && !streamingMessage && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-3 rounded-2xl rounded-bl-md bg-white border border-pink-100 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-3 border-t border-pink-100 bg-white">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 border-pink-200 focus:border-pink-400"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
