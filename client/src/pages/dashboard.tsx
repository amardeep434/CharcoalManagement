import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NewSaleModal } from "@/components/modals/new-sale-modal";
import { Plus, ChartLine, AlertTriangle, Building, Flame, TrendingUp, Clock, ExternalLink } from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";
import type { SaleWithHotel } from "@shared/schema";

export default function Dashboard() {
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  
  const { data: recentSales, isLoading: salesLoading } = useQuery<SaleWithHotel[]>({
    queryKey: ["/api/dashboard/recent-sales"],
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="payment-status-paid">Paid</Badge>;
      case "pending":
        return <Badge className="payment-status-pending">Pending</Badge>;
      case "partial":
        return <Badge className="payment-status-partial">Partial</Badge>;
      case "overdue":
        return <Badge className="payment-status-overdue">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your charcoal sales and payments"
        actions={
          <Button onClick={() => setShowNewSaleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        }
      />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : formatCurrency(stats?.totalSales || 0)}
                  </p>
                  <p className="text-sm text-success mt-1">
                    <TrendingUp className="inline mr-1 h-3 w-3" />
                    Active business
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ChartLine className="text-primary text-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : formatCurrency(stats?.pendingPayments || 0)}
                  </p>
                  <p className="text-sm text-warning mt-1">
                    <Clock className="inline mr-1 h-3 w-3" />
                    {stats?.overdueInvoices || 0} overdue invoices
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-warning text-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Hotels</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.activeHotels || 0}
                  </p>
                  <p className="text-sm text-success mt-1">
                    <Building className="inline mr-1 h-3 w-3" />
                    Business partners
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="text-success text-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : `${stats?.monthlyCharcoal || 0} kg`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <Flame className="inline mr-1 h-3 w-3" />
                    Charcoal delivered
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Flame className="text-gray-600 text-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales Table */}
          <div className="lg:col-span-2">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
                  <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium">
                    View all
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                      </TableRow>
                    ) : recentSales && recentSales.length > 0 ? (
                      recentSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <Building className="text-primary text-sm" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{sale.hotel.name}</div>
                                <div className="text-sm text-gray-500">ID: {sale.hotel.code}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-900">
                            {format(new Date(sale.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm text-gray-900">{sale.quantity} kg</TableCell>
                          <TableCell className="text-sm font-medium text-gray-900">
                            {formatCurrency(Number(sale.totalAmount))}
                          </TableCell>
                          <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No sales records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setShowNewSaleModal(true)}
                  >
                    <div className="flex items-center">
                      <Plus className="text-primary mr-3 h-4 w-4" />
                      <span className="text-sm font-medium text-gray-900">Record New Sale</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => navigate("/import")}
                  >
                    <div className="flex items-center">
                      <Flame className="text-primary mr-3 h-4 w-4" />
                      <span className="text-sm font-medium text-gray-900">Import Excel Data</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => navigate("/statements")}
                  >
                    <div className="flex items-center">
                      <ChartLine className="text-primary mr-3 h-4 w-4" />
                      <span className="text-sm font-medium text-gray-900">Generate Statement</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Payments Alert */}
            {stats && stats.overdueInvoices > 0 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <AlertTriangle className="text-warning text-sm" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-orange-900 mb-1">Payment Reminders</h4>
                      <p className="text-sm text-orange-700 mb-3">
                        You have {stats.overdueInvoices} overdue payments totaling {formatCurrency(stats.pendingPayments)}
                      </p>
                      <Button variant="link" className="text-sm font-medium text-orange-900 hover:text-orange-800 p-0">
                        Send Reminders →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentSales && recentSales.slice(0, 3).map((sale, index) => (
                    <div key={sale.id} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        sale.paymentStatus === "paid" ? "bg-green-500" :
                        sale.paymentStatus === "pending" ? "bg-yellow-500" : "bg-blue-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {sale.paymentStatus === "paid" ? "Payment received from" : "New sale recorded for"} {sale.hotel.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(sale.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <NewSaleModal open={showNewSaleModal} onOpenChange={setShowNewSaleModal} />
    </>
  );
}
