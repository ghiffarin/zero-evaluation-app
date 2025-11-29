'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
} from '@/components/ui';
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Globe,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  GraduationCap,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Calendar,
  Mail,
  Phone,
  Users,
  Target,
  ThumbsUp,
  ThumbsDown,
  Languages,
  Link as LinkIcon,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

interface RelatedContact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface University {
  id: string;
  universityName: string;
  country?: string;
  city?: string;
  programName?: string;
  specialization?: string;
  programLength?: string;
  programFormat?: string;
  programStartDate?: string;
  tuitionPerYear?: string;
  livingCostPerYear?: string;
  applicationFee?: string;
  admissionRequirements?: string;
  requiredDocuments?: string;
  englishTest?: string;
  ieltsMinScore?: number;
  toeflMinScore?: number;
  languageOfInstruction?: string;
  applicationDeadline?: string;
  applicationOpenDate?: string;
  decisionDate?: string;
  fundingOptions?: string;
  scholarshipAvailable?: boolean;
  websiteUrl?: string;
  applicationPortalUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  classSize?: number;
  acceptanceRate?: number;
  personalFitScore?: number;
  pros?: string;
  cons?: string;
  alumniNotes?: string;
  relatedContacts?: RelatedContact[];
  notes?: string;
  priority?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const UNIVERSITY_STATUSES = [
  { value: 'researching', label: 'Researching' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'enrolled', label: 'Enrolled' },
] as const;

const PROGRAM_FORMATS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'accepted':
    case 'enrolled':
      return 'success';
    case 'applying':
    case 'applied':
      return 'warning';
    case 'rejected':
      return 'error';
    case 'shortlisted':
      return 'info';
    default:
      return 'default';
  }
};

const getPriorityLabel = (priority?: number): string => {
  switch (priority) {
    case 1: return 'Top Choice';
    case 2: return 'Good Option';
    case 3: return 'Backup';
    default: return 'Not Set';
  }
};

const getPriorityVariant = (priority?: number): 'error' | 'warning' | 'success' | 'default' => {
  switch (priority) {
    case 1: return 'error';
    case 2: return 'warning';
    case 3: return 'success';
    default: return 'default';
  }
};

// Memoized InfoRow component
const InfoRow = React.memo(function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
});

// Loading skeleton component
const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </PageContainer>
  );
});

// Error state component
const ErrorState = React.memo(function ErrorState({
  error,
  onBack
}: {
  error: string | null;
  onBack: () => void;
}) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{error || 'University not found'}</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Universities
        </Button>
      </div>
    </PageContainer>
  );
});

export default function UniversityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [university, setUniversity] = React.useState<University | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<University>>({});

  const fetchUniversity = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<University>(`/masters-prep/universities/${id}`);
      setUniversity(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error('Failed to fetch university:', err);
      setError('Failed to load university details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (!user) return;
    fetchUniversity();
  }, [user, fetchUniversity]);

  const handleBack = React.useCallback(() => {
    router.push('/masters-prep?tab=universities');
  }, [router]);

  const handleSave = React.useCallback(async () => {
    if (!university) return;
    try {
      setSaving(true);
      const response = await api.put<University>(`/masters-prep/universities/${id}`, formData);
      setUniversity(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update university:', err);
      alert('Failed to update university');
    } finally {
      setSaving(false);
    }
  }, [university, id, formData]);

  const handleDelete = React.useCallback(async () => {
    if (!confirm('Are you sure you want to delete this university? This action cannot be undone.')) {
      return;
    }
    try {
      setDeleting(true);
      await api.delete(`/masters-prep/universities/${id}`);
      router.push('/masters-prep?tab=universities');
    } catch (err) {
      console.error('Failed to delete university:', err);
      alert('Failed to delete university');
      setDeleting(false);
    }
  }, [id, router]);

  const handleCancel = React.useCallback(() => {
    setFormData(university || {});
    setIsEditing(false);
  }, [university]);

  const handleStartEdit = React.useCallback(() => {
    setIsEditing(true);
  }, []);

  const updateFormField = React.useCallback((field: keyof University, value: string | number | boolean | undefined | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Memoized status label
  const statusLabel = React.useMemo(() => {
    return UNIVERSITY_STATUSES.find((s) => s.value === university?.status)?.label || university?.status;
  }, [university?.status]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !university) {
    return <ErrorState error={error} onBack={handleBack} />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <Button variant="ghost" className="w-fit" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Universities
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building className="h-8 w-8 text-primary" />
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={formData.universityName || ''}
                  onChange={(e) => updateFormField('universityName', e.target.value)}
                  className="text-2xl font-bold h-auto py-1 mb-1"
                />
              ) : (
                <h1 className="text-2xl font-bold">{university.universityName}</h1>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={getStatusVariant(university.status)}>{statusLabel}</Badge>
                {university.priority && (
                  <Badge variant={getPriorityVariant(university.priority)}>
                    {getPriorityLabel(university.priority)}
                  </Badge>
                )}
                {university.personalFitScore && (
                  <Badge variant="info" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Fit: {university.personalFitScore}/10
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleStartEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Program Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Program Name</Label>
                    <Input
                      value={formData.programName || ''}
                      onChange={(e) => updateFormField('programName', e.target.value)}
                      placeholder="e.g., MSc Environmental Engineering"
                    />
                  </div>
                  <div>
                    <Label>Specialization</Label>
                    <Input
                      value={formData.specialization || ''}
                      onChange={(e) => updateFormField('specialization', e.target.value)}
                      placeholder="e.g., Sustainable Energy"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={formData.country || ''}
                      onChange={(e) => updateFormField('country', e.target.value)}
                      placeholder="e.g., Germany"
                    />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => updateFormField('city', e.target.value)}
                      placeholder="e.g., Munich"
                    />
                  </div>
                  <div>
                    <Label>Program Length</Label>
                    <Input
                      value={formData.programLength || ''}
                      onChange={(e) => updateFormField('programLength', e.target.value)}
                      placeholder="e.g., 2 years"
                    />
                  </div>
                  <div>
                    <Label>Program Format</Label>
                    <select
                      value={formData.programFormat || ''}
                      onChange={(e) => updateFormField('programFormat', e.target.value || undefined)}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      <option value="">Select format...</option>
                      {PROGRAM_FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Program Start Date</Label>
                    <Input
                      value={formData.programStartDate || ''}
                      onChange={(e) => updateFormField('programStartDate', e.target.value)}
                      placeholder="e.g., September 2025"
                    />
                  </div>
                  <div>
                    <Label>Class Size</Label>
                    <Input
                      type="number"
                      value={formData.classSize || ''}
                      onChange={(e) => updateFormField('classSize', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div>
                    <Label>Acceptance Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.acceptanceRate || ''}
                      onChange={(e) => updateFormField('acceptanceRate', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="e.g., 25"
                    />
                  </div>
                  <div>
                    <Label>Language of Instruction</Label>
                    <Input
                      value={formData.languageOfInstruction || ''}
                      onChange={(e) => updateFormField('languageOfInstruction', e.target.value)}
                      placeholder="e.g., English"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Program" value={university.programName} />
                  <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Specialization" value={university.specialization} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value={university.city ? `${university.city}, ${university.country}` : university.country} />
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Duration" value={university.programLength} />
                  <InfoRow icon={<FileText className="h-4 w-4" />} label="Format" value={PROGRAM_FORMATS.find(f => f.value === university.programFormat)?.label || university.programFormat} />
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Start Date" value={university.programStartDate} />
                  <InfoRow icon={<Users className="h-4 w-4" />} label="Class Size" value={university.classSize} />
                  <InfoRow icon={<Target className="h-4 w-4" />} label="Acceptance Rate" value={university.acceptanceRate ? `${university.acceptanceRate}%` : undefined} />
                  <InfoRow icon={<Languages className="h-4 w-4" />} label="Language" value={university.languageOfInstruction} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Tuition per Year</Label>
                    <Input
                      value={formData.tuitionPerYear || ''}
                      onChange={(e) => updateFormField('tuitionPerYear', e.target.value)}
                      placeholder="e.g., €1,500"
                    />
                  </div>
                  <div>
                    <Label>Living Cost per Year</Label>
                    <Input
                      value={formData.livingCostPerYear || ''}
                      onChange={(e) => updateFormField('livingCostPerYear', e.target.value)}
                      placeholder="e.g., €10,000"
                    />
                  </div>
                  <div>
                    <Label>Application Fee</Label>
                    <Input
                      value={formData.applicationFee || ''}
                      onChange={(e) => updateFormField('applicationFee', e.target.value)}
                      placeholder="e.g., €75"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Tuition/Year" value={university.tuitionPerYear} />
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Living Cost/Year" value={university.livingCostPerYear} />
                  <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Application Fee" value={university.applicationFee} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Language Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>English Test</Label>
                    <Input
                      value={formData.englishTest || ''}
                      onChange={(e) => updateFormField('englishTest', e.target.value)}
                      placeholder="e.g., IELTS or TOEFL"
                    />
                  </div>
                  <div>
                    <Label>IELTS Min Score</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={formData.ieltsMinScore || ''}
                      onChange={(e) => updateFormField('ieltsMinScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="e.g., 6.5"
                    />
                  </div>
                  <div>
                    <Label>TOEFL Min Score</Label>
                    <Input
                      type="number"
                      value={formData.toeflMinScore || ''}
                      onChange={(e) => updateFormField('toeflMinScore', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g., 90"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="English Test" value={university.englishTest} />
                  <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="IELTS Min" value={university.ieltsMinScore} />
                  <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="TOEFL Min" value={university.toeflMinScore} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admission Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Admission Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Required Documents</Label>
                    <textarea
                      value={formData.requiredDocuments || ''}
                      onChange={(e) => updateFormField('requiredDocuments', e.target.value)}
                      placeholder="List required documents (CV, SOP, transcripts, etc.)..."
                      className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                  <div>
                    <Label>Admission Requirements</Label>
                    <textarea
                      value={formData.admissionRequirements || ''}
                      onChange={(e) => updateFormField('admissionRequirements', e.target.value)}
                      placeholder="List all admission requirements..."
                      className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {university.requiredDocuments && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Required Documents</p>
                      <p className="text-sm whitespace-pre-wrap">{university.requiredDocuments}</p>
                    </div>
                  )}
                  {university.admissionRequirements && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Requirements</p>
                      <p className="text-sm whitespace-pre-wrap">{university.admissionRequirements}</p>
                    </div>
                  )}
                  {!university.requiredDocuments && !university.admissionRequirements && (
                    <p className="text-sm text-muted-foreground">No requirements specified</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Funding Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Funding Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="scholarshipAvailable"
                      checked={formData.scholarshipAvailable || false}
                      onChange={(e) => updateFormField('scholarshipAvailable', e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="scholarshipAvailable">Scholarship Available</Label>
                  </div>
                  <div>
                    <Label>Funding Details</Label>
                    <textarea
                      value={formData.fundingOptions || ''}
                      onChange={(e) => updateFormField('fundingOptions', e.target.value)}
                      placeholder="Describe available funding options, scholarships, assistantships..."
                      className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {university.scholarshipAvailable && (
                    <Badge variant="success" className="mb-2">Scholarship Available</Badge>
                  )}
                  {university.fundingOptions ? (
                    <p className="text-sm whitespace-pre-wrap">{university.fundingOptions}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No funding options specified</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Personal Evaluation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Personal Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Personal Fit Score (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.personalFitScore || ''}
                      onChange={(e) => updateFormField('personalFitScore', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Rate how well this fits you (1-10)"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      Pros
                    </Label>
                    <textarea
                      value={formData.pros || ''}
                      onChange={(e) => updateFormField('pros', e.target.value)}
                      placeholder="List the advantages of this program..."
                      className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                      Cons
                    </Label>
                    <textarea
                      value={formData.cons || ''}
                      onChange={(e) => updateFormField('cons', e.target.value)}
                      placeholder="List the disadvantages or concerns..."
                      className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {university.personalFitScore && (
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Fit Score: {university.personalFitScore}/10</span>
                    </div>
                  )}
                  {university.pros && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        Pros
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{university.pros}</p>
                    </div>
                  )}
                  {university.cons && (
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4" />
                        Cons
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{university.cons}</p>
                    </div>
                  )}
                  {!university.personalFitScore && !university.pros && !university.cons && (
                    <p className="text-sm text-muted-foreground">No evaluation added yet</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Alumni & Networking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alumni & Networking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={formData.alumniNotes || ''}
                  onChange={(e) => updateFormField('alumniNotes', e.target.value)}
                  placeholder="Notes about alumni network, connections, networking opportunities..."
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                />
              ) : university.alumniNotes ? (
                <p className="text-sm whitespace-pre-wrap">{university.alumniNotes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No alumni notes added</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => updateFormField('notes', e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                />
              ) : university.notes ? (
                <p className="text-sm whitespace-pre-wrap">{university.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No notes added</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label>Status</Label>
                    <select
                      value={formData.status || 'researching'}
                      onChange={(e) => updateFormField('status', e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      {UNIVERSITY_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <select
                      value={formData.priority || ''}
                      onChange={(e) => updateFormField('priority', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      <option value="">Not Set</option>
                      <option value="1">Top Choice</option>
                      <option value="2">Good Option</option>
                      <option value="3">Backup</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusVariant(university.status)}>{statusLabel}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <Badge variant={getPriorityVariant(university.priority)}>
                      {getPriorityLabel(university.priority)}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label>Application Opens</Label>
                    <Input
                      value={formData.applicationOpenDate || ''}
                      onChange={(e) => updateFormField('applicationOpenDate', e.target.value)}
                      placeholder="e.g., October 1, 2024"
                    />
                  </div>
                  <div>
                    <Label>Application Deadline</Label>
                    <Input
                      value={formData.applicationDeadline || ''}
                      onChange={(e) => updateFormField('applicationDeadline', e.target.value)}
                      placeholder="e.g., January 15, 2025"
                    />
                  </div>
                  <div>
                    <Label>Decision Date</Label>
                    <Input
                      value={formData.decisionDate || ''}
                      onChange={(e) => updateFormField('decisionDate', e.target.value)}
                      placeholder="e.g., March 2025"
                    />
                  </div>
                </>
              ) : (
                <>
                  {university.applicationOpenDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Opens</span>
                      <span className="text-sm font-medium">{university.applicationOpenDate}</span>
                    </div>
                  )}
                  {university.applicationDeadline && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Deadline</span>
                      <span className="text-sm font-medium text-red-600">{university.applicationDeadline}</span>
                    </div>
                  )}
                  {university.decisionDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Decision</span>
                      <span className="text-sm font-medium">{university.decisionDate}</span>
                    </div>
                  )}
                  {!university.applicationOpenDate && !university.applicationDeadline && !university.decisionDate && (
                    <p className="text-sm text-muted-foreground">No dates set</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <Label>Program Website</Label>
                    <Input
                      value={formData.websiteUrl || ''}
                      onChange={(e) => updateFormField('websiteUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Application Portal</Label>
                    <Input
                      value={formData.applicationPortalUrl || ''}
                      onChange={(e) => updateFormField('applicationPortalUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </>
              ) : (
                <>
                  {university.websiteUrl && (
                    <a
                      href={university.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Program Website
                    </a>
                  )}
                  {university.applicationPortalUrl && (
                    <a
                      href={university.applicationPortalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Application Portal
                    </a>
                  )}
                  {!university.websiteUrl && !university.applicationPortalUrl && (
                    <p className="text-sm text-muted-foreground">No links added</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div>
                    <Label>Admissions Email</Label>
                    <Input
                      type="email"
                      value={formData.contactEmail || ''}
                      onChange={(e) => updateFormField('contactEmail', e.target.value)}
                      placeholder="admissions@university.edu"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.contactPhone || ''}
                      onChange={(e) => updateFormField('contactPhone', e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </>
              ) : (
                <>
                  {university.contactEmail && (
                    <a
                      href={`mailto:${university.contactEmail}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {university.contactEmail}
                    </a>
                  )}
                  {university.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {university.contactPhone}
                    </div>
                  )}
                  {!university.contactEmail && !university.contactPhone && (
                    <p className="text-sm text-muted-foreground">No contact info added</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(university.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(university.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
