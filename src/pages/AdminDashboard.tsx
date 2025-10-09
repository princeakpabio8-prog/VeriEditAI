import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, Users, UserCheck, Calendar, TrendingUp } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { exportToCSV } from "@/lib/export-utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminDataLicensingWidget } from "@/components/admin-data-licensing-widget";
import { TrustBriefsViewer } from "@/components/trust-briefs-viewer";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { subscribers, isLoading, isAdmin } = useAdminData();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || "User", email: user.email || "" } : undefined} />
        <div className="pt-24 px-4 max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You don't have permission to view this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const filteredSubscribers = subscribers?.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.subscription_tier?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = {
    total: subscribers?.length || 0,
    active: subscribers?.filter(s => s.subscribed).length || 0,
    free: subscribers?.filter(s => s.subscription_tier === 'free').length || 0,
    paid: subscribers?.filter(s => s.subscription_tier !== 'free').length || 0,
  };

  const handleExport = () => {
    if (subscribers) {
      exportToCSV(subscribers, 'subscribers-export');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} user={user ? { name: user.email?.split('@')[0] || "User", email: user.email || "" } : undefined} />
      
      <div className="pt-24 px-4 pb-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage subscribers and view analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.active}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Plan</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.free}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Plans</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats.paid}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="subscribers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="licensing">Data Licensing</TabsTrigger>
            <TabsTrigger value="briefs">Trust Briefs</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers" className="space-y-6">
            {/* Subscriber List */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>All Subscribers</CardTitle>
                    <CardDescription>View and manage your subscriber list</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email or plan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full md:w-64"
                      />
                    </div>
                    <Button onClick={handleExport} variant="outline" disabled={isLoading}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Monthly Usage</TableHead>
                          <TableHead>Subscription End</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscribers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No subscribers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSubscribers.map((subscriber) => (
                            <TableRow key={subscriber.id}>
                              <TableCell className="font-medium">{subscriber.email}</TableCell>
                              <TableCell>
                                <Badge variant={subscriber.subscription_tier === 'free' ? 'secondary' : 'default'}>
                                  {subscriber.subscription_tier || 'free'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={subscriber.subscribed ? 'default' : 'outline'}>
                                  {subscriber.subscribed ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell>{subscriber.monthly_usage || 0}</TableCell>
                              <TableCell>
                                {subscriber.subscription_end 
                                  ? format(new Date(subscriber.subscription_end), 'MMM d, yyyy')
                                  : 'N/A'
                                }
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="licensing" className="space-y-6">
            <AdminDataLicensingWidget />
          </TabsContent>

          <TabsContent value="briefs" className="space-y-6">
            <TrustBriefsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
