'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function FinancialPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Financial"
        description="Track your income and expenses"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No transactions recorded yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
