'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function MastersPrepPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Master's Prep"
        description="Track your master's degree preparation"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No prep items yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Prep Item
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
