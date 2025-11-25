'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function GoalsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Goals"
        description="Set and track your personal goals"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No goals set yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Goal
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
