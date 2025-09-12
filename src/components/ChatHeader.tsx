import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, ChevronDown } from "lucide-react";

interface ChatHeaderProps {
  currentUser: any;
  onUserSelect: (user: any) => void;
  users: any[];
  onSignOut: () => void;
}

export const ChatHeader = ({ currentUser, onUserSelect, users, onSignOut }: ChatHeaderProps) => {
  return (
    <div className="chat-header bg-card border-b border-border px-4 py-3 flex items-center gap-3">
      {currentUser && (
        <>
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {currentUser.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <h2 className="font-semibold text-foreground">{currentUser.name}</h2>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {users.filter(user => user.id !== currentUser.id).map((user) => (
                  <DropdownMenuItem 
                    key={user.id} 
                    onClick={() => onUserSelect(user)}
                  >
                    <Avatar className="w-6 h-6 mr-2">
                      <AvatarFallback className="text-xs">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};