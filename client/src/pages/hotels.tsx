import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import type { HotelWithStats } from "@shared/schema";

export default function Hotels() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: hotels, isLoading } = useQuery<HotelWithStats[]>({
    queryKey: ["/api/hotels-with-stats"],
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const filteredHotels = hotels?.filter((hotel) => {
    return hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           hotel.code.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  return (
    <>
      <Header
        title="Hotel Management"
        description="Manage hotel information and view performance stats"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Hotel
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
                placeholder="Search hotels by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hotels Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Pending Amount</TableHead>
                  <TableHead>Last Sale</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredHotels.length > 0 ? (
                  filteredHotels.map((hotel) => (
                    <TableRow key={hotel.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Building className="text-primary text-lg" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                            <div className="text-sm text-gray-500">Code: {hotel.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {hotel.contactPerson && (
                            <div className="text-sm text-gray-900">{hotel.contactPerson}</div>
                          )}
                          {hotel.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {hotel.email}
                            </div>
                          )}
                          {hotel.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {hotel.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">{hotel.totalSales}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(hotel.totalAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-red-600">
                        {formatCurrency(hotel.pendingAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {hotel.lastSaleDate 
                          ? format(new Date(hotel.lastSaleDate), "MMM dd, yyyy")
                          : "No sales"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={hotel.isActive ? "default" : "secondary"}>
                          {hotel.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm ? "No hotels found matching your search" : "No hotels found"}
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
