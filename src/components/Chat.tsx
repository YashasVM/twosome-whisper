import { useState, useRef, useEffect } from 'react';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { ChatHeader } from './ChatHeader';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isSent: boolean;
  isDelivered?: boolean;
}

const DEMO_RESPONSES = [
  "Hey! How's it going? 😊",
  "That sounds awesome!",
  "I'm doing great, thanks for asking!",
  "What are you up to today?",
  "Nice! Let me know how it goes 👍",
  "Haha, that's so funny! 😂",
  "I totally agree with you on that",
  "Sounds like a plan!",
  "Hope you have a great day!",
  "Talk to you soon! 👋"
];

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there! Welcome to our chat app! 👋",
      timestamp: new Date(Date.now() - 10000),
      isSent: false,
      isDelivered: true,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    const responseDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    
    setTimeout(() => {
      setIsTyping(false);
      
      // Simple response logic based on user input
      let response = DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
      
      if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
        response = "Hello! Nice to meet you! 😊";
      } else if (userMessage.toLowerCase().includes('how are you')) {
        response = "I'm doing great! Thanks for asking. How about you?";
      } else if (userMessage.toLowerCase().includes('bye')) {
        response = "See you later! Have a great day! 👋";
      }

      const newMessage: Message = {
        id: Date.now().toString() + '-received',
        text: response,
        timestamp: new Date(),
        isSent: false,
        isDelivered: true,
      };

      setMessages(prev => [...prev, newMessage]);
    }, responseDelay);
  };

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isSent: true,
      isDelivered: false,
    };

    setMessages(prev => [...prev, newMessage]);

    // Mark as delivered after a short delay
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === newMessage.id ? { ...msg, isDelivered: true } : msg
        )
      );
    }, 500);

    // Simulate response
    simulateResponse(text);
  };

  return (
    <div className="chat-container flex flex-col h-screen">
      <ChatHeader />
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
      >
        {messages.map((message, index) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            isLatest={index === messages.length - 1}
          />
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="message-bubble message-received flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};