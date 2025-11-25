'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function WellnessPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Wellness"
        description="Track meditation, mindfulness, and self-care"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No wellness activities logged yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Log Wellness Activity
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
