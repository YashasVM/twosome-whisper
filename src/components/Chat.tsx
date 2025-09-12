import { useState, useRef, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { ChatHeader } from './ChatHeader';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDocs, orderBy } from 'firebase/firestore';

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
    const q = query(collection(db, "profiles"), where("id", "!=", profile?.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOtherUsers(users);
      if (users.length > 0 && !currentChatUser) {
        setCurrentChatUser(users[0]);
      }
    });

    return () => unsubscribe();
  }, [profile?.id]);

  useEffect(() => {
    if (currentChatUser && profile) {
      const q = query(
        collection(db, "messages"),
        where('participants', 'array-contains', profile.id),
        orderBy('created_at', 'asc')
      );
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const newMessages: Message[] = [];
        const unreadMessages: string[] = [];
        snapshot.docs.forEach(doc => {
          if (doc.data().participants.includes(currentChatUser.id)) {
            const data = doc.data();
            newMessages.push({
              id: doc.id,
              content: data.content,
              sender_id: data.sender_id,
              created_at: data.created_at,
              read_at: data.read_at,
              isSent: data.sender_id === profile.id
            });
            if (data.receiver_id === profile.id && !data.read_at) {
              unreadMessages.push(doc.id);
            }
          }
        });
        setMessages(newMessages);

        // Mark messages as read
        for (const messageId of unreadMessages) {
          await updateDoc(doc(db, "messages", messageId), {
            read_at: serverTimestamp()
          });
        }
      });
      return () => unsubscribe();
    }
  }, [currentChatUser, profile]);
  
  useEffect(() => {
    const q = query(collection(db, "typing_indicators"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typing: TypingIndicator[] = [];
      snapshot.forEach(doc => {
        if(doc.id !== profile?.id) {
          typing.push({ user_id: doc.id, ...doc.data() } as TypingIndicator);
        }
      });
      setTypingUsers(typing);
    });
    return () => unsubscribe();
  }, [profile?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async (text: string) => {
    if (!currentChatUser || !profile) return;
    
    await addDoc(collection(db, "messages"), {
      content: text,
      sender_id: profile.id,
      receiver_id: currentChatUser.id,
      participants: [profile.id, currentChatUser.id],
      created_at: serverTimestamp(),
      read_at: null,
    });
    
    await updateTypingIndicator(false);
  };
  
  const updateTypingIndicator = async (typing: boolean) => {
    if (!profile) return;
    const typingRef = doc(db, "typing_indicators", profile.id);
    await setDoc(typingRef, { is_typing: typing, updated_at: serverTimestamp() });
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

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
                timestamp: message.created_at?.toDate(),
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