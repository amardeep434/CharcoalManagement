import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AuditLog } from "@shared/schema";

export default function AuditLogsPage() {
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", { tableName: tableFilter, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tableFilter && tableFilter !== "all") params.append('tableName', tableFilter);
      params.append('limit', limit.toString());
      
      const response = await apiRequest("GET", `/api/audit-logs?${params}`);
      return response.json();
    }
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE":
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      case "LOGIN":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredLogs = auditLogs?.filter(log => {
    // Filter by action
    const actionMatch = actionFilter === "all" || log.action === actionFilter;
    
    // Filter by search query
    const searchMatch = searchQuery === "" || 
      (log as any).username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log as any).firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log as any).lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordId?.toString().includes(searchQuery) ||
      log.userId?.toString().includes(searchQuery) ||
      log.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.oldValues)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.newValues)?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return actionMatch && searchMatch;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <div className="text-center">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track all system changes and user actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">{filteredLogs.length} entries</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by user, table, action, record ID, or values..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Table</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="hotels">Hotels</SelectItem>
                  <SelectItem value="suppliers">Suppliers</SelectItem>
                  <SelectItem value="purchases">Purchases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Limit</label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 entries</SelectItem>
                  <SelectItem value="50">50 entries</SelectItem>
                  <SelectItem value="100">100 entries</SelectItem>
                  <SelectItem value="200">200 entries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTableFilter("all");
                  setActionFilter("all");
                  setSearchQuery("");
                  setLimit(50);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <div className="space-y-4">
        {filteredLogs && filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="font-medium text-gray-900">
                        {log.tableName}
                      </span>
                      {log.recordId && (
                        <span className="text-sm text-gray-500">
                          ID: {log.recordId}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">User:</span> {(log as any).username ? `${(log as any).firstName || ''} ${(log as any).lastName || ''} (${(log as any).username})`.trim() : log.userId}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.ipAddress && (
                        <p>
                          <span className="font-medium">IP:</span> {log.ipAddress}
                        </p>
                      )}
                    </div>

                    {(log.oldValues || log.newValues) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {log.oldValues && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">OLD VALUES</p>
                            <pre className="text-xs bg-red-50 border border-red-200 rounded p-2 overflow-x-auto">
                              {typeof log.oldValues === 'string' ? log.oldValues : JSON.stringify(log.oldValues, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.newValues && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">NEW VALUES</p>
                            <pre className="text-xs bg-green-50 border border-green-200 rounded p-2 overflow-x-auto">
                              {typeof log.newValues === 'string' ? log.newValues : JSON.stringify(log.newValues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
              <p className="text-gray-600">
                {tableFilter || actionFilter 
                  ? "Try adjusting your filters to see more results"
                  : "System activity will appear here as users make changes"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}