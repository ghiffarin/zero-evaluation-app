'use client';

import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select } from '@/components/ui';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = React.useState(user?.name || '');
  const [timezone, setTimezone] = React.useState(user?.timezone || 'Asia/Jakarta');
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await updateProfile({ name, timezone });
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your account settings" />

      <div className="space-y-6 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {message && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    message.includes('success')
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="UTC">UTC</option>
                </Select>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
              <Button variant="destructive" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
