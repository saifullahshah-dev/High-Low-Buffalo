import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Reflection, UserSettings, Friend, Herd } from '@/types';
import { getUser, getFriends, getHerds } from '@/lib/api';
import { Frown, Smile, Sparkles, Loader2 } from 'lucide-react';

interface EditReflectionDialogProps {
  reflection: Reflection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReflection: Reflection) => Promise<void>;
}

const EditReflectionDialog: React.FC<EditReflectionDialogProps> = ({ reflection, isOpen, onClose, onSave }) => {
  const [high, setHigh] = useState(reflection.high);
  const [low, setLow] = useState(reflection.low);
  const [buffalo, setBuffalo] = useState(reflection.buffalo);
  const [sharedWith, setSharedWith] = useState<string>(reflection.sharedWith[0] || 'self');
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
  });
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [herdsList, setHerdsList] = useState<Herd[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (reflection) {
      setHigh(reflection.high);
      setLow(reflection.low);
      setBuffalo(reflection.buffalo);
      setSharedWith(reflection.sharedWith[0] || 'self');
    }
    getUser().then(user => {
      if (user.settings) setUserSettings(user.settings);
    }).catch(console.error);
    getFriends().then(setFriendsList).catch(console.error);
    getHerds().then(setHerdsList).catch(console.error);
  }, [reflection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedReflection: Reflection = {
        ...reflection,
        high: high.trim(),
        low: low.trim(),
        buffalo: buffalo.trim(),
        sharedWith: [sharedWith],
        // Timestamp update logic is handled by backend or ignored based on schema,
        // but we keep structure consistent with original.
        timestamp: new Date().toISOString(),
      };
      await onSave(updatedReflection);
      // Don't call onClose() here; parent handles closing on success.
    } finally {
      setIsSaving(false);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Reflection</DialogTitle>
          <DialogDescription>Make changes to your High, Low, and Buffalo here.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
                {friendsList.map(friend => (
                  <SelectItem key={friend.id} value={friend.id}>
                    {friend.full_name || friend.email}
                  </SelectItem>
                ))}
                {herdsList.map(herd => (
                  <SelectItem key={herd.id} value={herd.id}>{herd.name} (Herd)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditReflectionDialog;
