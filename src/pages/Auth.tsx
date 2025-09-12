import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, User, UserCheck } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const { signIn, user, profile } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user && profile) {
    return <Navigate to="/" replace />;
  }

  const users = [
    { name: 'Yashas V M', description: 'Admin user', icon: UserCheck },
    { name: 'Nireeksha (Chotu)', description: 'Buddu user', icon: User }
  ];

  const handleUserSelect = (userName: string) => {
    setSelectedUser(userName);
    setPassword('');
    setShowPasswordForm(true);
  };

  const handleBackToUserSelection = () => {
    setSelectedUser(null);
    setPassword('');
    setShowPasswordForm(false);
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
        setShowPasswordForm(false);
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

  if (showPasswordForm && selectedUser) {
    const selectedUserData = users.find(u => u.name === selectedUser);
    const IconComponent = selectedUserData?.icon || User;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <IconComponent className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Enter Password</CardTitle>
            <CardDescription>
              Enter the password for {selectedUser}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  onClick={handleBackToUserSelection}
                  className="flex-1"
                >
                  Back
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-8 h-8 text-primary" />
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
    </div>
  );
};

export default Auth;