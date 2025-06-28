import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet } from "lucide-react";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportResult {
  success: number;
  errors: { row: number; error: string }[];
  newHotels: number;
  newSales: number;
  newPayments: number;
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to import file");
      }

      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.success} records`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      onOpenChange(false);
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    if (!importMutation.isPending) {
      setSelectedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Excel Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <FileSpreadsheet className="text-green-600 text-xl" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h4>
            <p className="text-gray-600 mb-4">Choose an Excel file (.xlsx, .xls) containing your sales and payment data</p>
            
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2 mb-4">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={importMutation.isPending}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload-modal"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload-modal" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </label>
                </Button>
              </>
            )}
            
            <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
          </div>

          {/* Progress */}
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>Please wait</span>
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {/* Sample Data Format */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Expected Excel Format:</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Columns:</strong> Hotel Name, Date, Quantity, Rate Per Ton, Total Amount, Payment Status, Payment Date, Payment Amount</p>
              <p><strong>Example:</strong> Grand Plaza Hotel, 2024-11-15, 5.5, 4000, 22000, Paid, 2024-11-16, 22000</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending ? "Importing..." : "Import Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
