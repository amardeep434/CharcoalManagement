import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Building } from "lucide-react";
import { format } from "date-fns";
import type { Hotel, SaleWithHotel, Company } from "@shared/schema";

interface StatementSummary {
  totalSales: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
}

interface Statement {
  hotel: Hotel;
  sales: SaleWithHotel[];
  summary: StatementSummary;
  generatedAt: string;
}

export default function Statements() {
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const { data: companies, isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: hotels, isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });

  const { data: statement, isLoading: statementLoading } = useQuery<Statement>({
    queryKey: ["/api/export/statement", selectedHotelId, selectedCompanyId],
    queryFn: async () => {
      const url = `/api/export/statement/${selectedHotelId}?companyId=${selectedCompanyId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch statement');
      return response.json();
    },
    enabled: !!selectedHotelId && !!selectedCompanyId,
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

  const handleExportStatement = () => {
    if (statement) {
      const dataStr = JSON.stringify(statement, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `statement-${statement.hotel.code}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <>
      <Header
        title="Statements"
        description="Generate and view payment statements for hotels"
        actions={
          <Button onClick={handleExportStatement} disabled={!statement}>
            <Download className="mr-2 h-4 w-4" />
            Export Statement
          </Button>
        }
      />

      <div className="p-6">
        {/* Company and Hotel Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Your Charcoal Business
                </label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your business..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : companies && companies.length > 0 ? (
                      companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name} ({company.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-companies" disabled>No businesses found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Select Hotel Customer
                </label>
                <Select value={selectedHotelId} onValueChange={setSelectedHotelId} disabled={!selectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose hotel for statement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {hotelsLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : hotels && hotels.length > 0 ? (
                      hotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id.toString()}>
                          {hotel.name} ({hotel.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-hotels" disabled>No hotels found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" disabled={!selectedHotelId || !selectedCompanyId}>
                <Eye className="mr-2 h-4 w-4" />
                Preview Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statement Content */}
        {selectedHotelId && (
          <>
            {statementLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">Loading statement...</div>
                </CardContent>
              </Card>
            ) : statement ? (
              <div className="space-y-6">
                {/* Statement Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Payment Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Hotel Details</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="font-medium">{statement.hotel.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">Code: {statement.hotel.code}</div>
                          {statement.hotel.contactPerson && (
                            <div className="text-sm text-gray-600">Contact: {statement.hotel.contactPerson}</div>
                          )}
                          {statement.hotel.email && (
                            <div className="text-sm text-gray-600">Email: {statement.hotel.email}</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Statement Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Sales:</span>
                            <span className="font-medium">{statement.summary.totalSales}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Amount:</span>
                            <span className="font-medium">{formatCurrency(statement.summary.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Paid:</span>
                            <span className="font-medium text-green-600">{formatCurrency(statement.summary.totalPaid)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-semibold">Pending Amount:</span>
                            <span className="font-semibold text-red-600">{formatCurrency(statement.summary.totalPending)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Paid Amount</TableHead>
                            <TableHead>Pending</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statement.sales.map((sale: SaleWithHotel) => (
                            <TableRow key={sale.id}>
                              <TableCell>{format(new Date(sale.date), "MMM dd, yyyy")}</TableCell>
                              <TableCell>{sale.quantity} kg</TableCell>
                              <TableCell>{formatCurrency(Number(sale.ratePerKg))}</TableCell>
                              <TableCell className="font-medium">{formatCurrency(Number(sale.totalAmount))}</TableCell>
                              <TableCell className="text-green-600">{formatCurrency(sale.paidAmount)}</TableCell>
                              <TableCell className="text-red-600">{formatCurrency(sale.pendingAmount)}</TableCell>
                              <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Statement Footer */}
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500 text-center">
                      Statement generated on {format(new Date(statement.generatedAt), "MMMM dd, yyyy 'at' h:mm a")}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">Failed to load statement</div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!selectedHotelId && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Statement</h3>
              <p className="text-gray-500">Select a hotel from the dropdown above to generate and view their payment statement</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
