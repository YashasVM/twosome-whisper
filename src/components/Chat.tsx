import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  created_at: any;
  read_at?: any;
  isSent: boolean;
}

interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
}

export const Chat = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const [currentChatUser, setCurrentChatUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    // Set up other users based on current user
    const users = [
      {
        id: 'yashas-vm',
        name: 'Yashas V M',
        nice_comment: 'Admin user',
        created_at: new Date().toISOString(),
      },
      {
        id: 'nireeksha-chotu',
        name: 'Nireeksha (Chotu)',
        nice_comment: 'Buddu user',
        created_at: new Date().toISOString(),
      }
    ];
    
    const others = users.filter(u => u.id !== profile.id);
    setOtherUsers(others);
    if (others.length > 0 && !currentChatUser) {
      setCurrentChatUser(others[0]);
    }
  }, [profile?.id]);

  useEffect(() => {
    // Load messages from localStorage for current chat
    if (currentChatUser && profile) {
      const chatKey = `chat_${[profile.id, currentChatUser.id].sort().join('_')}`;
      const savedMessages = localStorage.getItem(chatKey);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        setMessages([]);
      }
    }
  }, [currentChatUser, profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async (text: string) => {
    if (!currentChatUser || !profile) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender_id: profile.id,
      created_at: new Date(),
      read_at: new Date(),
      isSent: true
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Save to localStorage
    const chatKey = `chat_${[profile.id, currentChatUser.id].sort().join('_')}`;
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
    
    setIsTyping(false);
  };
  
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const isOtherUserTyping = typingUsers.some(t => 
    t.is_typing && t.user_id === currentChatUser?.id
  );

  return (
    <div className="chat-container flex flex-col h-screen">
      <ChatHeader 
        currentUser={currentChatUser} 
        onUserSelect={setCurrentChatUser}
        users={otherUsers}
        onSignOut={signOut}
        isAdmin={isAdmin}
      />
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Start a conversation with {currentChatUser?.name}!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble 
              key={message.id} 
              message={{
                id: message.id,
                text: message.content,
                timestamp: message.created_at,
                isSent: message.isSent,
                isDelivered: !!message.read_at,
              }}
              isLatest={index === messages.length - 1}
            />
          ))
        )}
        
        {isOtherUserTyping && (
          <div className="flex justify-start">
            <div className="message-bubble message-received flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {currentChatUser?.name} is typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
};