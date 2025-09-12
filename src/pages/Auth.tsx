import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Heart, User } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { signIn, user, profile } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user && profile) {
    return <Navigate to="/" replace />;
  }

  const users = [
    { name: 'Yashas V M', description: 'Admin user', icon: User },
    { name: 'Nireeksha (Chotu)', description: 'Buddu user', icon: Heart }
  ];

  const handleUserSelect = (userName: string) => {
    setSelectedUser(userName);
    setPassword('');
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);

    try {
      const { error } = await signIn(selectedUser, password);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Welcome!",
          description: `You have successfully logged in as ${selectedUser}.`,
        });
        setShowPasswordDialog(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Buddy Chat</CardTitle>
          <CardDescription>
            Select your user to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map((user) => {
            const IconComponent = user.icon;
            return (
              <Button
                key={user.name}
                onClick={() => handleUserSelect(user.name)}
                variant="outline"
                className="w-full h-auto p-4 flex items-center justify-start space-x-3 hover:bg-primary/5 border-2 hover:border-primary/30"
              >
                <IconComponent className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <div className="font-semibold text-foreground">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.description}</div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              Enter the password for {selectedUser}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;