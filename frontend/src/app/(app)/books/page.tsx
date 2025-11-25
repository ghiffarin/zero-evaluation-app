'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function BooksPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Books"
        description="Track your reading progress"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No books in your library yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Book
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
