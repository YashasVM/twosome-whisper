import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, MessageSquare, TrendingUp, UserCheck, UserX, Heart, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PendingUser {
  id: string;
  name: string;
  nice_comment: string;
  created_at: string;
}

interface UsageData {
  date: string;
  messages: number;
  logins: number;
}

const AdminDashboard = () => {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    pendingApprovals: 0,
  });
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not admin
  if (!isAdmin && !loading) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      setupRealtimeSubscriptions();
    }
  }, [isAdmin]);

  const setupRealtimeSubscriptions = () => {
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch pending users
      const { data: pending } = await supabase
        .from('profiles')
        .select('id, name, nice_comment, created_at')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true });

      setPendingUsers(pending || []);

      // Fetch stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        totalMessages: totalMessages || 0,
        pendingApprovals: pending?.length || 0,
      });

      // Fetch usage data for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select('action, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Process usage data by date
      const usageByDate: { [key: string]: { messages: number; logins: number } } = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        usageByDate[dateStr] = { messages: 0, logins: 0 };
      }

      usageLogs?.forEach(log => {
        const date = log.created_at.split('T')[0];
        if (usageByDate[date]) {
          if (log.action === 'send_message') {
            usageByDate[date].messages++;
          } else if (log.action === 'login') {
            usageByDate[date].logins++;
          }
        }
      });

      const chartData = Object.entries(usageByDate).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        messages: data.messages,
        logins: data.logins,
      }));

      setUsageData(chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approval_status: approved ? 'approved' : 'rejected' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: approved ? "User Approved" : "User Rejected",
        description: `User has been ${approved ? 'approved' : 'rejected'} successfully.`,
      });

      // Remove from pending list
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and monitor app usage</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-3xl font-bold text-destructive">{stats.pendingApprovals}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">User Approvals</TabsTrigger>
            <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  Pending User Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending user approvals
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-start justify-between p-4 border rounded-lg bg-card"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.name}</h3>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Applied: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                            <div className="flex items-start gap-2">
                              <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-sm bg-muted p-2 rounded italic">
                                "{user.nice_comment}"
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleUserApproval(user.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserApproval(user.id, false)}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="messages" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Logins</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="logins" 
                        fill="hsl(var(--secondary))"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;