import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewSaleModal } from "@/components/modals/new-sale-modal";
import { Plus, Search, Building } from "lucide-react";
import { format } from "date-fns";
import type { SaleWithHotel } from "@shared/schema";

export default function Sales() {
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: sales, isLoading } = useQuery<SaleWithHotel[]>({
    queryKey: ["/api/sales"],
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

  const filteredSales = sales?.filter((sale) => {
    const matchesSearch = sale.hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.hotel.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sale.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <>
      <Header
        title="Sales Records"
        description="Manage all charcoal sales transactions"
        actions={
          <Button onClick={() => setShowNewSaleModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by hotel name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
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
                      <TableCell className="text-sm text-gray-900">
                        {formatCurrency(Number(sale.ratePerKg))}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(sale.totalAmount))}
                      </TableCell>
                      <TableCell className="text-sm text-green-600">
                        {formatCurrency(sale.paidAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-red-600">
                        {formatCurrency(sale.pendingAmount)}
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== "all" ? "No sales found matching your filters" : "No sales records found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <NewSaleModal open={showNewSaleModal} onOpenChange={setShowNewSaleModal} />
    </>
  );
}
