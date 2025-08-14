import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Eye, Database, FileText, Users, Building } from "lucide-react";
import type { ImportPreview } from "@shared/schema";

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
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<'upload' | 'analyze' | 'preview' | 'confirm' | 'result'>('upload');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/import/analyze", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error("Failed to analyze file");
      }

      return response.json();
    },
    onSuccess: (preview: ImportPreview) => {
      setImportPreview(preview);
      setStep('preview');
      setIsAnalyzing(false);
      toast({
        title: "File Analyzed",
        description: "Review the import preview and confirm to proceed",
      });
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze file",
        variant: "destructive",
      });
    },
  });

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
      setStep('result');
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
      setImportPreview(null);
      setStep('upload');
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      setIsAnalyzing(true);
      setStep('analyze');
      analyzeFileMutation.mutate(selectedFile);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      setStep('confirm');
      importMutation.mutate(selectedFile);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportPreview(null);
    setStep('upload');
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'sales': return <FileText className="h-4 w-4" />;
      case 'purchases': return <FileSpreadsheet className="h-4 w-4" />;
      case 'companies': return <Building className="h-4 w-4" />;
      case 'suppliers': return <Users className="h-4 w-4" />;
      case 'hotels': return <Building className="h-4 w-4" />;
      case 'payments': return <Database className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'sales': return 'text-blue-600 bg-blue-50';
      case 'purchases': return 'text-green-600 bg-green-50';
      case 'companies': return 'text-purple-600 bg-purple-50';
      case 'suppliers': return 'text-orange-600 bg-orange-50';
      case 'hotels': return 'text-pink-600 bg-pink-50';
      case 'payments': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
            <CardTitle>Enhanced Import Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'upload' || selectedFile ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  1
                </div>
                <span className="ml-3 text-sm font-medium text-gray-900">Upload File</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'analyze' || importPreview ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  2
                </div>
                <span className="ml-3 text-sm text-gray-500">Analyze & Preview</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'confirm' || step === 'result' ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  3
                </div>
                <span className="ml-3 text-sm text-gray-500">Confirm Import</span>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  importResult ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  4
                </div>
                <span className="ml-3 text-sm text-gray-500">Review Results</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        {step === 'upload' && !selectedFile && (
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

              {/* Enhanced Features Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">🚀 Enhanced Import Features:</h5>
                <div className="text-xs text-blue-800 space-y-1">
                  <p>• <strong>Multi-sheet Support:</strong> Automatically analyzes all sheets in your Excel file</p>
                  <p>• <strong>Pattern Detection:</strong> Identifies data types (Sales, Purchases, Companies, etc.)</p>
                  <p>• <strong>Smart Mapping:</strong> Automatically maps columns to database fields</p>
                  <p>• <strong>Preview & Validation:</strong> Shows exactly what will be imported before confirmation</p>
                  <p>• <strong>Admin Review:</strong> Requires admin confirmation before importing data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Selected - Ready for Analysis */}
        {step === 'upload' && selectedFile && (
          <Card>
            <CardHeader>
              <CardTitle>File Ready for Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
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
                  <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                    <Eye className="mr-2 h-4 w-4" />
                    {isAnalyzing ? "Analyzing..." : "Analyze File"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis in Progress */}
        {step === 'analyze' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Analyzing File...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Processing {selectedFile?.name}...</span>
                  <span>Please wait</span>
                </div>
                <Progress value={50} className="w-full" />
                <div className="text-xs text-gray-600">
                  <p>• Reading Excel sheets and detecting patterns</p>
                  <p>• Mapping columns to database fields</p>
                  <p>• Validating data integrity</p>
                  <p>• Generating import preview</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Preview */}
        {step === 'preview' && importPreview && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-blue-600" />
                  Import Analysis & Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importPreview.analysis.sheets.length}</div>
                    <div className="text-sm text-gray-600">Sheets Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{Math.round(importPreview.analysis.confidence * 100)}%</div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {importPreview.mappedData.reduce((sum, sheet) => sum + sheet.validRecords, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Valid Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {importPreview.mappedData.reduce((sum, sheet) => sum + sheet.invalidRecords, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Validation Errors</div>
                  </div>
                </div>

                {/* Overall Pattern Detection */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Overall Pattern Detection</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getPatternColor(importPreview.analysis.overallPattern)} border-0`}>
                      {getPatternIcon(importPreview.analysis.overallPattern)}
                      <span className="ml-1 capitalize">{importPreview.analysis.overallPattern}</span>
                    </Badge>
                    <span className="text-sm text-gray-600">
                      ({Math.round(importPreview.analysis.confidence * 100)}% confidence)
                    </span>
                  </div>
                </div>

                {/* Warnings */}
                {importPreview.analysis.warnings.length > 0 && (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        {importPreview.analysis.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Estimated Changes */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Estimated Database Changes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {importPreview.estimatedChanges.newSales > 0 && (
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{importPreview.estimatedChanges.newSales}</div>
                        <div className="text-xs text-blue-800">New Sales</div>
                      </div>
                    )}
                    {importPreview.estimatedChanges.newPurchases > 0 && (
                      <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{importPreview.estimatedChanges.newPurchases}</div>
                        <div className="text-xs text-green-800">New Purchases</div>
                      </div>
                    )}
                    {importPreview.estimatedChanges.newCompanies > 0 && (
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <div className="text-lg font-bold text-purple-600">{importPreview.estimatedChanges.newCompanies}</div>
                        <div className="text-xs text-purple-800">New Companies</div>
                      </div>
                    )}
                    {importPreview.estimatedChanges.newSuppliers > 0 && (
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="text-lg font-bold text-orange-600">{importPreview.estimatedChanges.newSuppliers}</div>
                        <div className="text-xs text-orange-800">New Suppliers</div>
                      </div>
                    )}
                    {importPreview.estimatedChanges.newHotels > 0 && (
                      <div className="text-center p-3 bg-pink-50 rounded">
                        <div className="text-lg font-bold text-pink-600">{importPreview.estimatedChanges.newHotels}</div>
                        <div className="text-xs text-pink-800">New Hotels</div>
                      </div>
                    )}
                    {importPreview.estimatedChanges.newPayments > 0 && (
                      <div className="text-center p-3 bg-indigo-50 rounded">
                        <div className="text-lg font-bold text-indigo-600">{importPreview.estimatedChanges.newPayments}</div>
                        <div className="text-xs text-indigo-800">New Payments</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Sheet Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Sheet-by-Sheet Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={importPreview.analysis.sheets[0]?.name || ""} className="w-full">
                  <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    {importPreview.analysis.sheets.map((sheet, index) => (
                      <TabsTrigger key={index} value={sheet.name} className="text-xs">
                        {sheet.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {importPreview.analysis.sheets.map((sheet, sheetIndex) => {
                    const mappedSheet = importPreview.mappedData.find(m => m.sheetName === sheet.name);
                    
                    return (
                      <TabsContent key={sheetIndex} value={sheet.name} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{sheet.rowCount}</div>
                            <div className="text-xs text-gray-600">Total Rows</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{sheet.columnCount}</div>
                            <div className="text-xs text-gray-600">Columns</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{mappedSheet?.validRecords || 0}</div>
                            <div className="text-xs text-gray-600">Valid Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{mappedSheet?.invalidRecords || 0}</div>
                            <div className="text-xs text-gray-600">Invalid Records</div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium">Detected Pattern:</span>
                            <Badge className={`${getPatternColor(sheet.detectedPattern)} border-0`}>
                              {getPatternIcon(sheet.detectedPattern)}
                              <span className="ml-1 capitalize">{sheet.detectedPattern}</span>
                            </Badge>
                            <span className="text-xs text-gray-600">
                              ({Math.round(sheet.confidence * 100)}% confidence)
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium">Target Table:</span> {mappedSheet?.targetTable || 'Unknown'}
                          </div>
                        </div>

                        {/* Column Mapping */}
                        <div>
                          <h5 className="text-sm font-medium mb-2">Column Mapping</h5>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Excel Column</TableHead>
                                <TableHead>Maps To</TableHead>
                                <TableHead>Sample Data</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sheet.columns.map((column, columnIndex) => {
                                const mappedField = Object.keys(sheet.mapping).find(key => sheet.mapping[key] === column);
                                const sampleData = sheet.sampleRows[0]?.[column];
                                
                                return (
                                  <TableRow key={columnIndex}>
                                    <TableCell className="font-medium">{column}</TableCell>
                                    <TableCell>
                                      {mappedField ? (
                                        <Badge variant="outline">{mappedField}</Badge>
                                      ) : (
                                        <Badge variant="secondary">Not mapped</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-600">
                                      {sampleData !== undefined ? String(sampleData) : 'N/A'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Sample Mapped Records */}
                        {mappedSheet && mappedSheet.sampleMappedRecords.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Sample Mapped Records</h5>
                            <div className="bg-gray-50 rounded p-3 text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(mappedSheet.sampleMappedRecords.slice(0, 2), null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Validation Errors */}
                        {mappedSheet && mappedSheet.validationErrors.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium mb-2 text-red-600">
                              Validation Errors ({mappedSheet.validationErrors.length})
                            </h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {mappedSheet.validationErrors.slice(0, 5).map((error, index) => (
                                <div key={index} className="text-xs p-2 bg-red-50 rounded">
                                  <Badge variant="destructive" className="mr-1">Row {error.row}</Badge>
                                  {error.errors.join(', ')}
                                </div>
                              ))}
                              {mappedSheet.validationErrors.length > 5 && (
                                <div className="text-xs text-gray-500">
                                  ... and {mappedSheet.validationErrors.length - 5} more errors
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>

            {/* Admin Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-orange-600" />
                  Admin Review Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>Admin Confirmation Required:</strong> Please review the analysis above carefully. 
                    This import will create/modify database records as shown in the estimated changes. 
                    This action cannot be easily undone.
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={resetImport}>
                    Cancel Import
                  </Button>
                  <Button onClick={handleImport} className="bg-orange-600 hover:bg-orange-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm & Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Confirmation in Progress */}
        {step === 'confirm' && importMutation.isPending && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Importing Data...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Processing import...</span>
                  <span>Please wait</span>
                </div>
                <Progress value={75} className="w-full" />
                <div className="text-xs text-gray-600">
                  <p>• Creating database records</p>
                  <p>• Validating relationships</p>
                  <p>• Updating statistics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {step === 'result' && importResult && (
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
