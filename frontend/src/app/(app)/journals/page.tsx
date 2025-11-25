'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function JournalsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Journal Reading"
        description="Track research papers and journal articles"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No journal entries yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Journal Entry
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
