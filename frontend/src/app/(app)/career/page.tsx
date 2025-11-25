'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function CareerPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Career"
        description="Track career activities and job applications"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No career activities logged yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Log Career Activity
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
