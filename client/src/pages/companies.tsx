import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building, Search, Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { NewCompanyModal } from "@/components/modals/new-company-modal";
import { EditCompanyModal } from "@/components/modals/edit-company-modal";
import type { Company, CompanyWithStats } from "@shared/schema";

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();

  const { data: companies = [], isLoading } = useQuery<CompanyWithStats[]>({
    queryKey: ["/api/companies-with-stats"],
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/companies/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete company");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies-with-stats"] });
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  const filteredCompanies = companies.filter(company =>
    searchQuery === "" ||
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const handleDeleteCompany = (company: Company) => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
      deleteCompanyMutation.mutate(company.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Header
          title="Company Management"
          description="Manage your charcoal businesses"
          icon={Building}
        />
        <div className="text-center">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Header
        title="Company Management"
        description="Manage your charcoal businesses"
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        }
      />

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search companies by name, code, contact person, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Building className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">{filteredCompanies.length} companies</span>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{company.name}</h3>
                      <Badge variant="outline">{company.code}</Badge>
                    </div>
                    {company.contactPerson && (
                      <p className="text-sm text-gray-600 mb-1">
                        Contact: {company.contactPerson}
                      </p>
                    )}
                    {company.phone && (
                      <p className="text-sm text-gray-600 mb-1">
                        Phone: {company.phone}
                      </p>
                    )}
                    {company.email && (
                      <p className="text-sm text-gray-600 mb-1">
                        Email: {company.email}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCompany(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      disabled={deleteCompanyMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Business Stats */}
                <div className="border-t pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sales</p>
                      <p className="font-medium">{company.totalSales || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Purchases</p>
                      <p className="font-medium">{company.totalPurchases || 0}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Hotels</p>
                      <p className="font-medium">{company.activeHotels || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Suppliers</p>
                      <p className="font-medium">{company.activeSuppliers || 0}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Revenue</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(company.totalRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Costs</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(company.totalCosts || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t">
                      <span className="text-gray-700">Profit</span>
                      <div className="flex items-center space-x-1">
                        {(company.profit || 0) >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={(company.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(company.profit || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? "No companies match your search criteria." : "Get started by adding your first charcoal business."}
            </p>
            <Button onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewCompanyModal
          open={showNewModal}
          onOpenChange={setShowNewModal}
        />
      )}

      {editingCompany && (
        <EditCompanyModal
          open={!!editingCompany}
          onOpenChange={(open: boolean) => !open && setEditingCompany(null)}
          company={editingCompany}
        />
      )}
    </div>
  );
}