import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Search, CreditCard } from "lucide-react";
import { format } from "date-fns";
import type { Payment } from "@shared/schema";

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const filteredPayments = payments?.filter((payment) => {
    return payment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           payment.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  return (
    <>
      <Header
        title="Payments"
        description="Track all payment transactions"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <CreditCard className="text-green-600 text-sm" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">#{payment.id}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">#{payment.saleId}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(Number(payment.amount))}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {payment.paymentMethod || "Not specified"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {payment.notes || "No notes"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm ? "No payments found matching your search" : "No payment records found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </>
  );
}
