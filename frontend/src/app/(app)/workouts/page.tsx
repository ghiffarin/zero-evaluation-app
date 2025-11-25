'use client';

import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

export default function WorkoutsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Workouts"
        description="Track your fitness activities"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log Workout
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No workouts logged yet.</p>
          <Button variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Start Workout
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
