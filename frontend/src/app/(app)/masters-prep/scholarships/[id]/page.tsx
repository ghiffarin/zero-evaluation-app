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
  Award,
  Building,
  DollarSign,
  FileText,
  Globe,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Link as LinkIcon,
  Users,
  Plus,
  Wallet,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatDate } from '@/lib/utils';

interface University {
  id: string;
  universityName: string;
  country?: string;
}

interface FundingItem {
  type: string;
  amount: string;
  currency?: string;
  description?: string;
}

const FUNDING_TYPES = [
  { value: 'tuition', label: 'Tuition Funding' },
  { value: 'monthly_allowance', label: 'Monthly Allowance' },
  { value: 'travel', label: 'Travel Allowance' },
  { value: 'health_insurance', label: 'Health Insurance' },
  { value: 'books', label: 'Books & Materials' },
  { value: 'housing', label: 'Housing Allowance' },
  { value: 'research', label: 'Research Grant' },
  { value: 'one_time', label: 'One-time Payment' },
  { value: 'other', label: 'Other' },
] as const;

interface Scholarship {
  id: string;
  universityId?: string;
  name: string;
  provider?: string;
  type: string;
  amount?: string;
  currency?: string;
  coverage?: string;
  eligibility?: string;
  applicationLink?: string;
  websiteUrl?: string;
  deadline?: string;
  status: string;
  priority?: number;
  notes?: string;
  funding?: FundingItem[];
  createdAt: string;
  updatedAt: string;
  university?: University;
}

const SCHOLARSHIP_TYPES = [
  { value: 'full', label: 'Full Scholarship' },
  { value: 'partial', label: 'Partial Scholarship' },
  { value: 'tuition', label: 'Tuition Only' },
  { value: 'living', label: 'Living Expenses' },
  { value: 'travel', label: 'Travel Grant' },
  { value: 'research', label: 'Research Grant' },
  { value: 'other', label: 'Other' },
] as const;

const SCHOLARSHIP_STATUSES = [
  { value: 'researching', label: 'Researching' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'applying', label: 'Applying' },
  { value: 'applied', label: 'Applied' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
] as const;

const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'awarded':
      return 'success';
    case 'applying':
    case 'applied':
      return 'warning';
    case 'rejected':
    case 'expired':
      return 'error';
    case 'eligible':
      return 'info';
    default:
      return 'default';
  }
};

const getPriorityLabel = (priority?: number): string => {
  switch (priority) {
    case 1: return 'High';
    case 2: return 'Medium';
    case 3: return 'Low';
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

// Funding Display Component (read-only view)
const FundingDisplay = React.memo(function FundingDisplay({ funding }: { funding: FundingItem[] }) {
  if (!funding || funding.length === 0) {
    return <p className="text-sm text-muted-foreground">No funding details specified</p>;
  }

  return (
    <div className="space-y-3">
      {funding.map((item, index) => {
        const typeLabel = FUNDING_TYPES.find(t => t.value === item.type)?.label || item.type;
        return (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Wallet className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{typeLabel}</p>
                <p className="text-sm font-semibold text-primary">
                  {item.amount}{item.currency ? ` ${item.currency}` : ''}
                </p>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// Funding Editor Component (edit mode)
function FundingEditor({
  funding,
  onChange,
}: {
  funding: FundingItem[];
  onChange: (funding: FundingItem[]) => void;
}) {
  const addFundingItem = () => {
    onChange([...funding, { type: 'tuition', amount: '', currency: 'EUR' }]);
  };

  const updateFundingItem = (index: number, field: keyof FundingItem, value: string) => {
    const updated = [...funding];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeFundingItem = (index: number) => {
    onChange(funding.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {funding.length === 0 && (
        <p className="text-sm text-muted-foreground">No funding items. Click "Add Funding" to add one.</p>
      )}
      {funding.map((item, index) => (
        <div key={index} className="p-4 rounded-lg border bg-background space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Funding Item {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeFundingItem(index)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={item.type}
                onChange={(e) => updateFundingItem(index, 'type', e.target.value)}
                className="w-full h-9 px-3 py-1 text-sm rounded-md border border-input bg-background"
              >
                {FUNDING_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Amount</Label>
                <Input
                  value={item.amount}
                  onChange={(e) => updateFundingItem(index, 'amount', e.target.value)}
                  placeholder="e.g., 1000"
                  className="h-9"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">Currency</Label>
                <Input
                  value={item.currency || ''}
                  onChange={(e) => updateFundingItem(index, 'currency', e.target.value)}
                  placeholder="EUR"
                  className="h-9"
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={item.description || ''}
              onChange={(e) => updateFundingItem(index, 'description', e.target.value)}
              placeholder="e.g., Per month, One-time payment, etc."
              className="h-9"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addFundingItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Funding
      </Button>
    </div>
  );
}

// Memoized InfoRow component
const InfoRow = React.memo(function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
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
        <p className="text-muted-foreground">{error || 'Scholarship not found'}</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scholarships
        </Button>
      </div>
    </PageContainer>
  );
});

export default function ScholarshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [scholarship, setScholarship] = React.useState<Scholarship | null>(null);
  const [universities, setUniversities] = React.useState<University[]>([]);
  const [universitiesLoaded, setUniversitiesLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<Scholarship>>({});

  const fetchScholarship = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Scholarship>(`/masters-prep/scholarships/${id}`);
      setScholarship(response.data);
      setFormData(response.data);
    } catch (err) {
      console.error('Failed to fetch scholarship:', err);
      setError('Failed to load scholarship details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Lazy load universities only when entering edit mode
  const fetchUniversities = React.useCallback(async () => {
    if (universitiesLoaded) return;
    try {
      const response = await api.get<University[]>('/masters-prep/universities');
      setUniversities(response.data);
      setUniversitiesLoaded(true);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    }
  }, [universitiesLoaded]);

  React.useEffect(() => {
    if (!user) return;
    fetchScholarship();
  }, [user, fetchScholarship]);

  const handleBack = React.useCallback(() => {
    router.push('/masters-prep?tab=scholarships');
  }, [router]);

  const handleSave = React.useCallback(async () => {
    if (!scholarship) return;
    try {
      setSaving(true);
      // Strip out fields that shouldn't be sent to the API
      const { id: _id, createdAt, updatedAt, university, ...updateData } = formData as Scholarship;
      const response = await api.put<Scholarship>(`/masters-prep/scholarships/${id}`, updateData);
      setScholarship(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update scholarship:', err);
      alert('Failed to update scholarship');
    } finally {
      setSaving(false);
    }
  }, [scholarship, id, formData]);

  const handleDelete = React.useCallback(async () => {
    if (!confirm('Are you sure you want to delete this scholarship? This action cannot be undone.')) {
      return;
    }
    try {
      setDeleting(true);
      await api.delete(`/masters-prep/scholarships/${id}`);
      router.push('/masters-prep?tab=scholarships');
    } catch (err) {
      console.error('Failed to delete scholarship:', err);
      alert('Failed to delete scholarship');
      setDeleting(false);
    }
  }, [id, router]);

  const handleCancel = React.useCallback(() => {
    setFormData(scholarship || {});
    setIsEditing(false);
  }, [scholarship]);

  // Start edit and lazy load universities
  const handleStartEdit = React.useCallback(() => {
    setIsEditing(true);
    fetchUniversities();
  }, [fetchUniversities]);

  const updateFormField = React.useCallback((field: keyof Scholarship, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleUniversityClick = React.useCallback(() => {
    if (scholarship?.university?.id) {
      router.push(`/masters-prep/universities/${scholarship.university.id}`);
    }
  }, [router, scholarship?.university?.id]);

  // Memoized labels
  const statusLabel = React.useMemo(() => {
    return SCHOLARSHIP_STATUSES.find((s) => s.value === scholarship?.status)?.label || scholarship?.status;
  }, [scholarship?.status]);

  const typeLabel = React.useMemo(() => {
    return SCHOLARSHIP_TYPES.find((t) => t.value === scholarship?.type)?.label || scholarship?.type;
  }, [scholarship?.type]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !scholarship) {
    return <ErrorState error={error} onBack={handleBack} />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <Button variant="ghost" className="w-fit" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scholarships
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={formData.name || ''}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  className="text-2xl font-bold h-auto py-1 mb-1"
                />
              ) : (
                <h1 className="text-2xl font-bold">{scholarship.name}</h1>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={getStatusVariant(scholarship.status)}>{statusLabel}</Badge>
                <Badge variant="outline">{typeLabel}</Badge>
                {scholarship.priority && (
                  <Badge variant={getPriorityVariant(scholarship.priority)}>
                    {getPriorityLabel(scholarship.priority)} Priority
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
          {/* Scholarship Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Scholarship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={formData.provider || ''}
                      onChange={(e) => updateFormField('provider', e.target.value)}
                      placeholder="e.g., DAAD, Erasmus+"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select
                      value={formData.type || 'partial'}
                      onChange={(e) => updateFormField('type', e.target.value)}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      {SCHOLARSHIP_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      value={formData.amount || ''}
                      onChange={(e) => updateFormField('amount', e.target.value)}
                      placeholder="e.g., €10,000"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={formData.currency || ''}
                      onChange={(e) => updateFormField('currency', e.target.value)}
                      placeholder="e.g., EUR, USD"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>University</Label>
                    <select
                      value={formData.universityId || ''}
                      onChange={(e) => updateFormField('universityId', e.target.value || undefined)}
                      className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background"
                    >
                      <option value="">Any/General</option>
                      {universities.map((uni) => (
                        <option key={uni.id} value={uni.id}>
                          {uni.universityName} {uni.country ? `(${uni.country})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={<Users className="h-4 w-4" />} label="Provider" value={scholarship.provider} />
                  <InfoRow icon={<Award className="h-4 w-4" />} label="Type" value={typeLabel} />
                  <InfoRow
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Amount"
                    value={scholarship.amount ? `${scholarship.amount}${scholarship.currency ? ` ${scholarship.currency}` : ''}` : undefined}
                  />
                  <InfoRow
                    icon={<Building className="h-4 w-4" />}
                    label="University"
                    value={scholarship.university?.universityName || 'Any/General'}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Funding
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <FundingEditor
                  funding={(formData.funding as FundingItem[]) || []}
                  onChange={(funding) => setFormData(prev => ({ ...prev, funding }))}
                />
              ) : (
                <FundingDisplay funding={scholarship.funding || []} />
              )}
            </CardContent>
          </Card>

          {/* Coverage (Text Description) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Coverage Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={formData.coverage || ''}
                  onChange={(e) => updateFormField('coverage', e.target.value)}
                  placeholder="Additional details about what this scholarship covers..."
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                />
              ) : scholarship.coverage ? (
                <p className="text-sm whitespace-pre-wrap">{scholarship.coverage}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No additional coverage details</p>
              )}
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Eligibility Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <textarea
                  value={formData.eligibility || ''}
                  onChange={(e) => updateFormField('eligibility', e.target.value)}
                  placeholder="List eligibility requirements..."
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                />
              ) : scholarship.eligibility ? (
                <p className="text-sm whitespace-pre-wrap">{scholarship.eligibility}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No eligibility requirements specified</p>
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
              ) : scholarship.notes ? (
                <p className="text-sm whitespace-pre-wrap">{scholarship.notes}</p>
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
                      {SCHOLARSHIP_STATUSES.map((status) => (
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
                      <option value="1">High</option>
                      <option value="2">Medium</option>
                      <option value="3">Low</option>
                    </select>
                  </div>
                  <div>
                    <Label>Application Deadline</Label>
                    <Input
                      value={formData.deadline || ''}
                      onChange={(e) => updateFormField('deadline', e.target.value)}
                      placeholder="e.g., January 15, 2025"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={getStatusVariant(scholarship.status)}>{statusLabel}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <Badge variant={getPriorityVariant(scholarship.priority)}>
                      {getPriorityLabel(scholarship.priority)}
                    </Badge>
                  </div>
                  {scholarship.deadline && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Deadline</span>
                      <span className="text-sm font-medium">{scholarship.deadline}</span>
                    </div>
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
                    <Label>Website URL</Label>
                    <Input
                      value={formData.websiteUrl || ''}
                      onChange={(e) => updateFormField('websiteUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Application Link</Label>
                    <Input
                      value={formData.applicationLink || ''}
                      onChange={(e) => updateFormField('applicationLink', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </>
              ) : (
                <>
                  {scholarship.websiteUrl && (
                    <a
                      href={scholarship.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Visit Website
                    </a>
                  )}
                  {scholarship.applicationLink && (
                    <a
                      href={scholarship.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Application Portal
                    </a>
                  )}
                  {!scholarship.websiteUrl && !scholarship.applicationLink && (
                    <p className="text-sm text-muted-foreground">No links added</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Related University */}
          {scholarship.university && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  University
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleUniversityClick}
                >
                  <Building className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <p className="font-medium">{scholarship.university.universityName}</p>
                    {scholarship.university.country && (
                      <p className="text-xs text-muted-foreground">{scholarship.university.country}</p>
                    )}
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(scholarship.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(scholarship.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
