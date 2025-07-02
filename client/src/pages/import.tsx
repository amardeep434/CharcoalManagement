import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  success: number;
  errors: { row: number; error: string }[];
  newHotels: number;
  newSales: number;
  newPayments: number;
}

export default function Import() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
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
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error("Failed to import file");
      }

      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.success} records`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
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
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
  };

  return (
    <>
      <Header
        title="Import Data"
        description="Import sales and payment data from Excel files"
      />

      <div className="p-6 max-w-4xl">
        {/* Import Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Import Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  selectedFile ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  1
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">Upload File</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  selectedFile && !importMutation.isPending ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  2
                </div>
                <span className="ml-3 text-sm text-gray-500">Process Data</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  importResult ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  3
                </div>
                <span className="ml-3 text-sm text-gray-500">Review Results</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        {!selectedFile && !importResult && (
          <Card>
            <CardContent className="p-8">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <FileSpreadsheet className="text-green-600 text-xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h4>
                <p className="text-gray-600 mb-4">Choose an Excel file (.xlsx, .xls) containing your sales and payment data</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </label>
                </Button>
                <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
              </div>

              {/* Sample Data Format */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Expected Excel Format:</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Columns:</strong> Hotel Name, Date, Quantity, Rate Per Ton, Total Amount, Payment Status, Payment Date, Payment Amount</p>
                  <p><strong>Example:</strong> Grand Plaza Hotel, 2024-11-15, 5.5, 4000, 22000, Paid, 2024-11-16, 22000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Selected */}
        {selectedFile && !importResult && (
          <Card>
            <CardHeader>
              <CardTitle>File Ready for Import</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetImport}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={importMutation.isPending}>
                    {importMutation.isPending ? "Importing..." : "Import Data"}
                  </Button>
                </div>
              </div>

              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing file...</span>
                    <span>Please wait</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-gray-600">Records Imported</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.newHotels}</div>
                    <div className="text-sm text-gray-600">New Hotels</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{importResult.newSales}</div>
                    <div className="text-sm text-gray-600">New Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{importResult.newPayments}</div>
                    <div className="text-sm text-gray-600">New Payments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <XCircle className="mr-2 h-5 w-5 text-red-600" />
                    Import Errors ({importResult.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="flex items-start space-x-2 p-2 bg-red-50 rounded">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm">
                            <Badge variant="destructive" className="mr-2">Row {error.row}</Badge>
                            {error.error}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" onClick={resetImport}>
                    Import Another File
                  </Button>
                  <Button onClick={() => window.location.href = "/sales"}>
                    View Imported Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
