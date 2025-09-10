import { MessageCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        
        <div>
          <h2 className="font-semibold text-foreground">Chat Buddy</h2>
          <p className="text-xs text-muted-foreground">Online now</p>
        </div>
      </div>

      <Button 
        variant="ghost" 
        size="icon"
        className="w-8 h-8 text-muted-foreground hover:text-foreground"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  );
};