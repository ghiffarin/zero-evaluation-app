'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function ReflectionsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Reflections"
        description="Daily reflections and personal insights"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Reflection
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No reflections yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Write Reflection
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
