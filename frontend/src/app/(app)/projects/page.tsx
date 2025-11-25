'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Manage your personal and professional projects"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No projects yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Project
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
