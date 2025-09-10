import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  created_at: string;
  read_at?: string;
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

  // Redirect to auth if not authenticated
  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchOtherUsers();
    setupRealtimeSubscriptions();
  }, [profile?.id]);

  useEffect(() => {
    if (currentChatUser) {
      fetchMessages();
    }
  }, [currentChatUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOtherUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile?.id);
    
    setOtherUsers(data || []);
    // Auto-select first user for chat
    if (data && data.length > 0) {
      setCurrentChatUser(data[0]);
    }
  };

  const fetchMessages = async () => {
    if (!currentChatUser || !profile) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(name),
        receiver:profiles!messages_receiver_id_fkey(name)
      `)
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${currentChatUser.id}),and(sender_id.eq.${currentChatUser.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });

    const formattedMessages: Message[] = (data || []).map(msg => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender_id,
      sender_name: msg.sender?.name,
      created_at: msg.created_at,
      read_at: msg.read_at,
      isSent: msg.sender_id === profile.id,
    }));

    setMessages(formattedMessages);

    // Mark messages as read
    if (data && data.length > 0) {
      const unreadMessages = data.filter(msg => 
        msg.receiver_id === profile.id && !msg.read_at
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(msg => msg.id));
      }
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Messages subscription
    const messagesSubscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          if (currentChatUser) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    // Typing indicators subscription
    const typingSubscription = supabase
      .channel('typing-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators' },
        (payload: any) => {
          const newRecord = payload.new;
          if (newRecord && newRecord.user_id !== profile?.id) {
            setTypingUsers(prev => {
              const filtered = prev.filter(t => t.user_id !== newRecord.user_id);
              if (newRecord.is_typing) {
                return [...filtered, { user_id: newRecord.user_id, is_typing: true }];
              }
              return filtered;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(typingSubscription);
    };
  };

  const updateTypingIndicator = async (typing: boolean) => {
    if (!profile) return;

    await supabase
      .from('typing_indicators')
      .upsert({
        user_id: profile.id,
        is_typing: typing,
        updated_at: new Date().toISOString()
      });
  };

  const handleSendMessage = async (text: string) => {
    if (!currentChatUser || !profile) return;

    // Send message
    const { data } = await supabase
      .from('messages')
      .insert([{
        sender_id: profile.id,
        receiver_id: currentChatUser.id,
        content: text
      }])
      .select()
      .single();

    // Log usage
    await supabase
      .from('usage_logs')
      .insert([{
        user_id: profile.id,
        action: 'send_message'
      }]);

    // Stop typing indicator
    await updateTypingIndicator(false);
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingIndicator(false);
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
                timestamp: new Date(message.created_at),
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