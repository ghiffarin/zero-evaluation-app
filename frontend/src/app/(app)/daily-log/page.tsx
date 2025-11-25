'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function DailyLogPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Daily Log"
        description="Track your daily activities and well-being"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No entries yet. Start tracking your day!</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Today's Log
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
