'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function SkillsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Skills"
        description="Track your skill development journey"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Session
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No skill sessions logged yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Start Learning Session
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
