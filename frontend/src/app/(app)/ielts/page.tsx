'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function IeltsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="IELTS Practice"
        description="Track your IELTS preparation progress"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No IELTS sessions logged yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Start Practice Session
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
