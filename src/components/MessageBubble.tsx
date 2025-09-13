import { CheckCheck, Check } from 'lucide-react';
import { formatTime } from '../lib/formatTime';

interface Message {
  id: string;
  text: string;
  timestamp: Date | string;
  isSent: boolean;
  isDelivered?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export const MessageBubble = ({ message, isLatest }: MessageBubbleProps) => {
  return (
    <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`message-bubble ${
          message.isSent ? 'message-sent' : 'message-received'
        } ${isLatest ? 'message-animate-in' : ''}`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        
        <div className={`flex items-center gap-1 mt-1 ${
          message.isSent ? 'justify-end' : 'justify-start'
        }`}>
          <span className="text-xs opacity-70">
            {formatTime(message.timestamp)}
          </span>
          
          {message.isSent && (
            <div className="ml-1">
              {message.isDelivered ? (
                <CheckCheck className="w-3 h-3 opacity-70" />
              ) : (
                <Check className="w-3 h-3 opacity-50" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};