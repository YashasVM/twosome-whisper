import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    name: '',
    password: '',
  });

  const [signupForm, setSignupForm] = useState({
    name: '',
    password: '',
    niceComment: '',
  });

  // Redirect if already authenticated and approved
  if (user && profile?.approval_status === 'approved') {
    return <Navigate to="/" replace />;
  }

  // Show pending message if user is waiting for approval
  if (user && profile?.approval_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <MessageCircle className="w-16 h-16 mx-auto text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Approval Pending</h2>
            <p className="text-muted-foreground mb-4">
              Your account is waiting for approval from YashasVM. You'll be able to access the chat once approved!
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rejected message
  if (user && profile?.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2 text-destructive">Access Denied</h2>
            <p className="text-muted-foreground">
              Your account was not approved. Please contact YashasVM if you think this was an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginForm.name, loginForm.password);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupForm.niceComment.trim()) {
      toast({
        title: "Missing Required Field",
        description: "Please say something nice about YashasVM!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      signupForm.name,
      signupForm.password,
      signupForm.niceComment
    );

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Your account is pending approval from YashasVM.",
      });
    }

    setIsLoading(false);
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
            Connect with your friends in a safe space
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-name">Name</Label>
                  <Input
                    id="login-name"
                    type="text"
                    placeholder="Enter your name"
                    value={loginForm.name}
                    onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your name"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nice-comment" className="flex items-center gap-2">
                    Say something nice about YashasVM 
                    <Heart className="w-4 h-4 text-red-500" />
                  </Label>
                  <Textarea
                    id="nice-comment"
                    placeholder="Write something thoughtful and kind..."
                    value={signupForm.niceComment}
                    onChange={(e) => setSignupForm({ ...signupForm, niceComment: e.target.value })}
                    required
                    className="min-h-[80px]"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;