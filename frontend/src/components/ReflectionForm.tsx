import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createReflection, getUser } from '@/lib/api';
import { ReflectionCreate, UserSettings } from '@/types';
import { showSuccess, showError } from '@/utils/toast';
import { Frown, Smile, Sparkles, Loader2 } from 'lucide-react';

const ReflectionForm = () => {
  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const [buffalo, setBuffalo] = useState('');
  const [sharedWith, setSharedWith] = useState<string>('self'); // 'self', 'friendId', 'herdId'
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
    herds: [{ id: 'self', name: 'Just Me', members: [] }],
    friends: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = await getUser();
        if (user.settings) {
          setUserSettings(user.settings);
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!high.trim() || !low.trim() || !buffalo.trim()) {
      showError("Please fill in all three reflection fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newReflection: ReflectionCreate = {
        high: high.trim(),
        low: low.trim(),
        buffalo: buffalo.trim(),
        sharedWith: [sharedWith],
      };

      await createReflection(newReflection);

      showSuccess("Your reflection has been shared!");
      setHigh('');
      setLow('');
      setBuffalo('');
      setSharedWith('self');
    } catch (error) {
      console.error("Failed to create reflection:", error);
      showError("Failed to share reflection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'high': return <Smile className="h-4 w-4 text-green-500" />;
      case 'low': return <Frown className="h-4 w-4 text-red-500" />;
      case 'buffalo': return <Sparkles className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Share Your Day</CardTitle>
        <CardDescription className="text-center">What was your High, Low, and Buffalo moment?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="high" className="flex items-center gap-2">
              {getIcon('high')} High
            </Label>
            <Textarea
              id="high"
              placeholder="What was the best part of your day?"
              value={high}
              onChange={(e) => setHigh(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="low" className="flex items-center gap-2">
              {getIcon('low')} Low
            </Label>
            <Textarea
              id="low"
              placeholder="What was challenging or difficult?"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buffalo" className="flex items-center gap-2">
              {getIcon('buffalo')} Buffalo
            </Label>
            <Textarea
              id="buffalo"
              placeholder="What was surprising, random, or unexpected?"
              value={buffalo}
              onChange={(e) => setBuffalo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shareWith">Share With</Label>
            <Select value={sharedWith} onValueChange={setSharedWith}>
              <SelectTrigger id="shareWith">
                <SelectValue placeholder="Select who to share with" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Just Me (Private)</SelectItem>
                {userSettings.friends.map(friend => (
                  <SelectItem key={friend} value={friend}>{friend}</SelectItem>
                ))}
                {userSettings.herds.filter(h => h.id !== 'self').map(herd => (
                  <SelectItem key={herd.id} value={herd.id}>{herd.name} (Herd)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              'Share Reflection'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReflectionForm;