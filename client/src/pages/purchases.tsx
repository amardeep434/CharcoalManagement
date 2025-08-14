import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit2, Trash2, Calendar, Package, DollarSign, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { insertPurchaseSchema, type InsertPurchase, type PurchaseWithSupplier, type Company, type Supplier } from "@shared/schema";
import { Header } from "@/components/layout/header";

const purchaseFormSchema = insertPurchaseSchema.extend({
  date: insertPurchaseSchema.shape.date.transform((val) => val instanceof Date ? format(val, 'yyyy-MM-dd') : val),
});

type PurchaseFormData = Omit<InsertPurchase, 'date'> & {
  date: string;
};

function PurchaseModal({ 
  purchase, 
  companies, 
  suppliers,
  onClose 
}: { 
  purchase?: PurchaseWithSupplier;
  companies: Company[];
  suppliers: Supplier[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: purchase ? {
      companyId: purchase.companyId,
      supplierId: purchase.supplierId,
      date: format(purchase.date, 'yyyy-MM-dd'),
      quantity: purchase.quantity,
      ratePerKg: purchase.ratePerKg,
      totalAmount: purchase.totalAmount,
      invoiceNumber: purchase.invoiceNumber || "",
      notes: purchase.notes || "",
    } : {
      companyId: 0,
      supplierId: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 0,
      ratePerKg: 0,
      totalAmount: 0,
      invoiceNumber: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const purchaseData = {
        ...data,
        date: new Date(data.date),
      };
      
      const url = purchase ? `/api/purchases/${purchase.id}` : "/api/purchases";
      const method = purchase ? "PUT" : "POST";
      return apiRequest(method, url, purchaseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Purchase ${purchase ? 'updated' : 'created'} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${purchase ? 'update' : 'create'} purchase`,
        variant: "destructive",
      });
    },
  });

  const quantity = form.watch("quantity");
  const ratePerKg = form.watch("ratePerKg");

  // Auto-calculate total amount
  const totalAmount = quantity && ratePerKg ? Number(quantity) * Number(ratePerKg) : 0;
  if (totalAmount !== form.getValues("totalAmount")) {
    form.setValue("totalAmount", totalAmount);
  }

  const onSubmit = (data: PurchaseFormData) => {
    createMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{purchase ? 'Edit Purchase' : 'Add New Purchase'}</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Select value={String(field.value || "")} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={String(company.id)}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Select value={String(field.value || "")} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ratePerKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per kg (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    readOnly
                    className="bg-gray-50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Optional notes" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : purchase ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function PaymentStatusBadge({ status }: { status: "paid" | "partial" | "pending" | "overdue" }) {
  const variants = {
    paid: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800", 
    pending: "bg-blue-100 text-blue-800",
    overdue: "bg-red-100 text-red-800",
  };

  const labels = {
    paid: "Paid",
    partial: "Partial",
    pending: "Pending", 
    overdue: "Overdue",
  };

  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  );
}

export default function Purchases() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseWithSupplier | undefined>();
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["/api/purchases"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/purchases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Purchase deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive",
      });
    },
  });

  const filteredPurchases = purchases.filter((purchase: PurchaseWithSupplier) => {
    const matchesSearch = purchase.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCompany = selectedCompany === "all" || purchase.companyId === Number(selectedCompany);
    return matchesSearch && matchesCompany;
  });

  const handleEdit = (purchase: PurchaseWithSupplier) => {
    setEditingPurchase(purchase);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this purchase?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateModal = () => {
    setEditingPurchase(undefined);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <>
        <Header
          title="Purchase Records"
          description="Track charcoal purchases from suppliers and manage invoices"
          actions={
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
          }
        />
        <div className="p-6">
          <div className="text-center py-8">Loading purchases...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Purchase Records"
        description="Track charcoal purchases from suppliers and manage invoices"
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </Button>
        }
      />
      
      <div className="p-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by supplier name, code, or invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company: Company) => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No purchases found</p>
              <p className="text-sm">
                {searchTerm || selectedCompany !== "all" ? "Try adjusting your search or filters" : "Start by adding your first purchase record"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchases.map((purchase: PurchaseWithSupplier) => (
                <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <h3 className="font-semibold text-lg">{purchase.supplier.name}</h3>
                        <PaymentStatusBadge status={purchase.paymentStatus} />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(purchase.date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>{purchase.quantity} kg</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>₹{Number(purchase.ratePerKg).toFixed(2)}/kg</span>
                        </div>
                        {purchase.invoiceNumber && (
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>#{purchase.invoiceNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Company:</span> {purchase.company.name}
                      </div>

                      {purchase.notes && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {purchase.notes}
                        </div>
                      )}

                      <div className="flex space-x-4 text-sm">
                        <span>
                          <span className="font-medium text-green-600">Paid:</span> ₹{purchase.paidAmount.toFixed(2)}
                        </span>
                        <span>
                          <span className="font-medium text-red-600">Pending:</span> ₹{purchase.pendingAmount.toFixed(2)}
                        </span>
                        <span>
                          <span className="font-medium">Total:</span> ₹{Number(purchase.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(purchase)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(purchase.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          {isModalOpen && (
            <PurchaseModal
              purchase={editingPurchase}
              companies={companies}
              suppliers={suppliers}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </Dialog>
      </div>
    </>
  );
}