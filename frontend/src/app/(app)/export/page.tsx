'use client';

import * as React from 'react';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import {
  Download,
  Upload,
  FileText,
  Database,
  FileJson,
  Loader2,
  CheckCircle,
  HardDrive,
  AlertCircle,
  FileUp,
  X,
} from 'lucide-react';
import { api, getAuthToken } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface ExportSummary {
  counts: Record<string, number>;
  totalRecords: number;
}

interface ImportValidation {
  valid: boolean;
  summary: Record<string, number>;
  totalRecords: number;
  exportedAt: string;
}

interface ImportResults {
  message: string;
  mode: string;
  results: Record<string, { imported: number; skipped: number; errors: number }>;
  totals: { imported: number; skipped: number; errors: number };
}

const TABLE_LABELS: Record<string, string> = {
  dailyLogs: 'Daily Logs',
  ieltsSessions: 'IELTS Sessions',
  ieltsMistakes: 'IELTS Mistakes',
  ieltsVocab: 'IELTS Vocabulary',
  journalEntries: 'Journal Entries',
  books: 'Books',
  bookReadingSessions: 'Book Reading Sessions',
  skillSessions: 'Skill Sessions',
  workoutSessions: 'Workout Sessions',
  workoutSets: 'Workout Sets',
  wellnessEntries: 'Wellness Entries',
  financialTransactions: 'Financial Transactions',
  reflectionEntries: 'Reflection Entries',
  careerActivities: 'Career Activities',
  careerActivityLogs: 'Career Activity Logs',
  jobApplications: 'Job Applications',
  mastersPrepItems: 'Masters Prep Items',
  mastersPrepSessions: 'Masters Prep Sessions',
  mastersPrepNotes: 'Masters Prep Notes',
  universities: 'Universities',
  scholarships: 'Scholarships',
  projects: 'Projects',
  goals: 'Goals',
  goalProgress: 'Goal Progress',
  tags: 'Tags',
};

const EXPORT_FORMATS = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Full data export in JSON format. Best for backup and restoration.',
    icon: FileJson,
    extension: '.json',
  },
  {
    id: 'csv',
    name: 'CSV Bundle',
    description: 'CSV data for each table. Best for spreadsheet analysis.',
    icon: FileText,
    extension: '.json (contains CSV data)',
  },
  {
    id: 'sql',
    name: 'SQL',
    description: 'SQL INSERT statements. Best for database migration.',
    icon: Database,
    extension: '.sql',
  },
] as const;

export default function ExportPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = React.useState<ExportSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = React.useState<string | null>(null);

  // Import state
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importData, setImportData] = React.useState<unknown>(null);
  const [importValidation, setImportValidation] = React.useState<ImportValidation | null>(null);
  const [importMode, setImportMode] = React.useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = React.useState(false);
  const [validating, setValidating] = React.useState(false);
  const [importResults, setImportResults] = React.useState<ImportResults | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    async function fetchSummary() {
      try {
        setLoading(true);
        const res = await api.export.summary();
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch export summary:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [authLoading, isAuthenticated]);

  const handleExport = async (format: 'json' | 'csv' | 'sql') => {
    setExporting(format);
    setExportSuccess(null);

    try {
      const token = getAuthToken();
      // Use Next.js proxy route to avoid CORS and port issues
      const url = `/api/export/${format}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `pd_os_export.${format === 'csv' ? 'json' : format}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setExportSuccess(format);
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportValidation(null);
    setImportResults(null);
    setValidating(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setImportData(data);

      // Validate the import data
      const response = await api.import.validate(data);
      if (response.data) {
        setImportValidation(response.data);
      }
    } catch (err) {
      console.error('Failed to parse import file:', err);
      setImportError('Invalid JSON file. Please select a valid export file.');
      setImportFile(null);
      setImportData(null);
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!importData) return;

    setImporting(true);
    setImportError(null);

    try {
      const response = await api.import.json(importData, importMode);
      if (response.data) {
        setImportResults(response.data);
        // Refresh export summary after import
        const summaryRes = await api.export.summary();
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setImportError(err instanceof Error ? err.message : 'Failed to import data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const clearImport = () => {
    setImportFile(null);
    setImportData(null);
    setImportValidation(null);
    setImportResults(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Export & Import Data"
        description="Transfer your data between devices or create backups"
      />

      <div className="space-y-6 max-w-4xl">
        {/* Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl font-bold">{summary?.totalRecords || 0}</div>
              <div className="text-muted-foreground">Total Records</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {summary?.counts && Object.entries(summary.counts)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([table, count]) => (
                  <div
                    key={table}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <span className="text-sm truncate">{TABLE_LABELS[table] || table}</span>
                    <Badge variant="neutral" className="ml-2">{count}</Badge>
                  </div>
                ))}
            </div>

            {(!summary?.counts || Object.values(summary.counts).every(c => c === 0)) && (
              <p className="text-muted-foreground text-sm">No data to export yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Export Formats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Formats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                const isExporting = exporting === format.id;
                const isSuccess = exportSuccess === format.id;

                return (
                  <div
                    key={format.id}
                    className="relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors flex flex-col min-h-[200px]"
                  >
                    <div className="flex items-start gap-3 flex-1 mb-4">
                      <div className="p-2 rounded-md bg-primary/10 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{format.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          File type: {format.extension}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-auto"
                      onClick={() => handleExport(format.id as 'json' | 'csv' | 'sql')}
                      disabled={isExporting || !summary?.totalRecords}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Downloaded!
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download {format.name}
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File upload area */}
              {!importFile && !importResults && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Click to select a JSON export file</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only JSON exports from this application are supported
                  </p>
                </div>
              )}

              {/* Validating */}
              {validating && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>Validating import file...</span>
                </div>
              )}

              {/* Error */}
              {importError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Import Error</p>
                    <p className="text-sm mt-1">{importError}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={clearImport}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Validation preview */}
              {importValidation && !importResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileJson className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{importFile?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Exported: {importValidation.exportedAt}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearImport}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Data to Import</h4>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-2xl font-bold">{importValidation.totalRecords}</div>
                      <div className="text-muted-foreground">Total Records</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(importValidation.summary)
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([table, count]) => (
                          <div
                            key={table}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                          >
                            <span className="text-xs truncate">{TABLE_LABELS[table] || table}</span>
                            <Badge variant="neutral" className="ml-2 text-xs">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Import mode selection */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Import Mode</h4>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Merge</p>
                          <p className="text-sm text-muted-foreground">
                            Add new records without deleting existing data. Duplicates will be skipped.
                          </p>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Replace</p>
                          <p className="text-sm text-muted-foreground">
                            Delete all existing data and replace with imported data. Use with caution!
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Warning for replace mode */}
                  {importMode === 'replace' && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Warning</p>
                        <p className="text-sm mt-1">
                          Replace mode will permanently delete all your existing data before importing.
                          Make sure you have a backup if needed.
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {importValidation.totalRecords} Records
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Import results */}
              {importResults && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Import Complete!</p>
                      <p className="text-sm mt-1">
                        Successfully imported {importResults.totals.imported} records
                        {importResults.totals.skipped > 0 && `, skipped ${importResults.totals.skipped} duplicates`}
                        {importResults.totals.errors > 0 && `, ${importResults.totals.errors} errors`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">Import Summary</h4>
                    <div className="space-y-2">
                      {Object.entries(importResults.results).map(([table, result]) => (
                        <div
                          key={table}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                        >
                          <span className="text-sm">{TABLE_LABELS[table] || table}</span>
                          <div className="flex gap-2">
                            {result.imported > 0 && (
                              <Badge variant="success" className="text-xs">+{result.imported}</Badge>
                            )}
                            {result.skipped > 0 && (
                              <Badge variant="neutral" className="text-xs">{result.skipped} skipped</Badge>
                            )}
                            {result.errors > 0 && (
                              <Badge variant="destructive" className="text-xs">{result.errors} errors</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={clearImport}>
                    Import Another File
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use Your Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">JSON Export</h4>
              <p className="text-sm text-muted-foreground">
                Contains all your data in a structured JSON format. This is the most complete
                backup format. You can use this file to restore your data or import into
                compatible systems.
              </p>
            </div>
            <div>
              <h4 className="font-medium">CSV Bundle</h4>
              <p className="text-sm text-muted-foreground">
                A JSON file containing CSV-formatted data for each table. Extract the CSV
                content for each table and save as separate .csv files to open in Excel,
                Google Sheets, or other spreadsheet applications.
              </p>
            </div>
            <div>
              <h4 className="font-medium">SQL Export</h4>
              <p className="text-sm text-muted-foreground">
                Contains SQL INSERT statements for all your data. You can run these statements
                in a PostgreSQL database to recreate your data. Useful for database migration
                or setting up a new instance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
