import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSaleSchema, type Hotel } from "@shared/schema";
import { z } from "zod";

const newSaleFormSchema = insertSaleSchema.extend({
  date: z.string().min(1, "Date is required"),
});

type NewSaleForm = z.infer<typeof newSaleFormSchema>;

interface NewSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSaleModal({ open, onOpenChange }: NewSaleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: hotels, isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ["/api/hotels"],
  });

  const form = useForm<NewSaleForm>({
    resolver: zodResolver(newSaleFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      ratePerTon: 4000,
      totalAmount: 0,
      notes: "",
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: NewSaleForm) => {
      const response = await apiRequest("POST", "/api/sales", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale",
        variant: "destructive",
      });
    },
  });

  const quantity = form.watch("quantity");
  const ratePerTon = form.watch("ratePerTon");

  // Auto-calculate total amount
  const totalAmount = quantity * ratePerTon;
  form.setValue("totalAmount", totalAmount);

  const onSubmit = (data: NewSaleForm) => {
    createSaleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record New Sale</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hotel</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hotel..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hotelsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : hotels && hotels.length > 0 ? (
                        hotels.map((hotel) => (
                          <SelectItem key={hotel.id} value={hotel.id.toString()}>
                            {hotel.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-hotels" disabled>No hotels found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (tons)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ratePerTon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate per ton (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="4000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Auto-calculated"
                        {...field}
                        value={totalAmount}
                        readOnly
                        className="bg-gray-50 text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSaleMutation.isPending}
              >
                {createSaleMutation.isPending ? "Saving..." : "Save Sale"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
