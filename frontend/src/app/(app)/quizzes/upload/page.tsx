'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileJson, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import type { CreateQuizRequest } from '@/types/quiz';

export default function UploadQuizPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedQuiz, setParsedQuiz] = useState<CreateQuizRequest | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: false, errors: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateQuizJSON = (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.meta) errors.push('Missing "meta" field');
    if (!data.sections) errors.push('Missing "sections" field');
    if (!data.questions) errors.push('Missing "questions" field');

    if (data.meta) {
      if (!data.meta.title) errors.push('Missing meta.title');
      if (!data.meta.total_questions) errors.push('Missing meta.total_questions');
      if (!data.meta.recommended_time_minutes) errors.push('Missing meta.recommended_time_minutes');
      if (!data.meta.scoring) errors.push('Missing meta.scoring');

      if (data.meta.scoring) {
        if (data.meta.scoring.correct_points === undefined) errors.push('Missing meta.scoring.correct_points');
        if (data.meta.scoring.wrong_points === undefined) errors.push('Missing meta.scoring.wrong_points');
        if (!data.meta.scoring.max_score) errors.push('Missing meta.scoring.max_score');
      }
    }

    if (data.sections && !Array.isArray(data.sections)) {
      errors.push('sections must be an array');
    }

    if (data.questions) {
      if (!Array.isArray(data.questions)) {
        errors.push('questions must be an array');
      } else {
        data.questions.forEach((q: any, idx: number) => {
          if (!q.id) errors.push(`Question ${idx + 1}: missing id`);
          if (!q.type) errors.push(`Question ${idx + 1}: missing type`);
          if (!q.prompt) errors.push(`Question ${idx + 1}: missing prompt`);
          if (!q.choices) errors.push(`Question ${idx + 1}: missing choices`);
          if (!q.answer) errors.push(`Question ${idx + 1}: missing answer`);
        });

        if (data.meta && data.questions.length !== data.meta.total_questions) {
          errors.push(`Question count mismatch: ${data.questions.length} questions but meta.total_questions is ${data.meta.total_questions}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleJSONChange = (value: string) => {
    setJsonInput(value);
    setUploadSuccess(false);

    if (!value.trim()) {
      setParsedQuiz(null);
      setValidation({ valid: false, errors: [] });
      return;
    }

    try {
      const parsed = JSON.parse(value);
      const validation = validateQuizJSON(parsed);
      setValidation(validation);

      if (validation.valid) {
        setParsedQuiz(parsed);
      } else {
        setParsedQuiz(null);
      }
    } catch (error) {
      setValidation({ valid: false, errors: ['Invalid JSON format'] });
      setParsedQuiz(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleJSONChange(content);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!parsedQuiz) return;

    setUploading(true);
    try {
      await api.quizzes.create(parsedQuiz);
      setUploadSuccess(true);

      setTimeout(() => {
        router.push('/quizzes');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload quiz');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setFile(null);
    setParsedQuiz(null);
    setValidation({ valid: false, errors: [] });
    setUploadSuccess(false);
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        <Link
          href="/quizzes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>

        <PageHeader
          title="Upload Quiz"
          description="Upload a JSON file or paste JSON content to create a new quiz"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload JSON File</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JSON files only
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json"
                    onChange={handleFileUpload}
                  />
                </label>
              </CardContent>
            </Card>

            {/* Or paste JSON */}
            <Card>
              <CardHeader>
                <CardTitle>Or Paste JSON</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-96 px-4 py-3 bg-secondary border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Paste your quiz JSON here..."
                  value={jsonInput}
                  onChange={(e) => handleJSONChange(e.target.value)}
                />
                {jsonInput && (
                  <button
                    onClick={handleClear}
                    className="mt-3 text-sm text-destructive hover:underline"
                  >
                    Clear
                  </button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview & Validation Section */}
          <div className="space-y-4">
            {/* Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Validation</CardTitle>
              </CardHeader>
              <CardContent>
                {!jsonInput && (
                  <div className="flex items-start gap-3 text-muted-foreground">
                    <FileJson className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">Upload or paste JSON to validate</p>
                  </div>
                )}

                {jsonInput && validation.valid && (
                  <div className="flex items-start gap-3 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Valid Quiz JSON</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ready to upload
                      </p>
                    </div>
                  </div>
                )}

                {jsonInput && !validation.valid && validation.errors.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                      <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Invalid JSON</p>
                        <p className="text-sm">Please fix the following errors:</p>
                      </div>
                    </div>
                    <ul className="ml-8 space-y-1">
                      {validation.errors.map((error, idx) => (
                        <li key={idx} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="flex items-start gap-3 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Upload Successful!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Redirecting to quizzes...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quiz Preview */}
            {parsedQuiz && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <span className="ml-2 font-medium">
                        {parsedQuiz.meta.title}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Difficulty:</span>
                      <span className="ml-2 font-medium capitalize">
                        {parsedQuiz.meta.difficulty}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Questions:</span>
                      <span className="ml-2 font-medium">
                        {parsedQuiz.meta.total_questions}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recommended Time:</span>
                      <span className="ml-2 font-medium">
                        {parsedQuiz.meta.recommended_time_minutes} minutes
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sections:</span>
                      <span className="ml-2 font-medium">
                        {parsedQuiz.sections.length}
                    </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Score:</span>
                      <span className="ml-2 font-medium">
                        {parsedQuiz.meta.scoring.max_score}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Button */}
            {parsedQuiz && !uploadSuccess && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
