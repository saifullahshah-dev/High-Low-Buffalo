import React, { useState, useEffect } from 'react';
import { getUserSettings, saveUserSettings } from '@/lib/storage';
import { UserSettings, Herd } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings>(getUserSettings());
  const [newFriendName, setNewFriendName] = useState('');
  const [newHerdName, setNewHerdName] = useState('');

  useEffect(() => {
    saveUserSettings(settings);
  }, [settings]);

  const handleCadenceChange = (value: 'daily' | 'weekly' | 'paused') => {
    setSettings(prev => ({ ...prev, notificationCadence: value }));
    showSuccess(`Notification cadence set to ${value}.`);
  };

  const handleAddFriend = () => {
    if (newFriendName.trim() && !settings.friends.includes(newFriendName.trim())) {
      setSettings(prev => ({
        ...prev,
        friends: [...prev.friends, newFriendName.trim()],
      }));
      setNewFriendName('');
      showSuccess(`Friend "${newFriendName.trim()}" added.`);
    } else if (settings.friends.includes(newFriendName.trim())) {
      showError(`Friend "${newFriendName.trim()}" already exists.`);
    }
  };

  const handleRemoveFriend = (friendToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      friends: prev.friends.filter(friend => friend !== friendToRemove),
    }));
    showSuccess(`Friend "${friendToRemove}" removed.`);
  };

  const handleAddHerd = () => {
    if (newHerdName.trim() && !settings.herds.some(herd => herd.name === newHerdName.trim())) {
      const newHerd: Herd = {
        id: `herd-${Date.now()}`,
        name: newHerdName.trim(),
        members: [], // Members can be added later
      };
      setSettings(prev => ({
        ...prev,
        herds: [...prev.herds, newHerd],
      }));
      setNewHerdName('');
      showSuccess(`Herd "${newHerdName.trim()}" created.`);
    } else if (settings.herds.some(herd => herd.name === newHerdName.trim())) {
      showError(`Herd "${newHerdName.trim()}" already exists.`);
    }
  };

  const handleRemoveHerd = (herdId: string) => {
    setSettings(prev => ({
      ...prev,
      herds: prev.herds.filter(herd => herd.id !== herdId),
    }));
    showSuccess(`Herd removed.`);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how often you'd like to receive prompts to share your High, Low, and Buffalo.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.notificationCadence}
            onValueChange={handleCadenceChange}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="daily" id="daily" />
              <Label htmlFor="daily">Daily</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="paused" id="paused" />
              <Label htmlFor="paused">Paused</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Friends</CardTitle>
          <CardDescription>Add or remove friends you can share reflections with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Friend's name"
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
            />
            <Button onClick={handleAddFriend}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Friend
            </Button>
          </div>
          <div className="space-y-2">
            {settings.friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends added yet.</p>
            ) : (
              settings.friends.map((friend) => (
                <div key={friend} className="flex items-center justify-between p-2 border rounded-md">
                  <span>{friend}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveFriend(friend)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Herds (Groups)</CardTitle>
          <CardDescription>Create or remove groups to share reflections with multiple people.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Herd name"
              value={newHerdName}
              onChange={(e) => setNewHerdName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddHerd()}
            />
            <Button onClick={handleAddHerd}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Herd
            </Button>
          </div>
          <div className="space-y-2">
            {settings.herds.filter(h => h.id !== 'self').length === 0 ? (
              <p className="text-sm text-muted-foreground">No herds created yet.</p>
            ) : (
              settings.herds.filter(h => h.id !== 'self').map((herd) => (
                <div key={herd.id} className="flex items-center justify-between p-2 border rounded-md">
                  <span>{herd.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveHerd(herd.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;