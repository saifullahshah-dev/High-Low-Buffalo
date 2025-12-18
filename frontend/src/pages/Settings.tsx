import React, { useState, useEffect } from 'react';
import { getUser, updateUserSettings, addFriend, getFriends } from '@/lib/api';
import { UserSettings, Herd, Friend } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
    herds: [{ id: 'self', name: 'Just Me', members: [] }],
    friends: [],
  });
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [newHerdName, setNewHerdName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser();
        if (user.settings) {
          setSettings(user.settings);
        }
        const friends = await getFriends();
        setFriendsList(friends);
      } catch (error) {
        console.error('Failed to load settings or friends:', error);
      }
    };
    fetchData();
  }, []);

  const save = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      await updateUserSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Failed to save settings.');
    }
  };

  const handleCadenceChange = (value: 'daily' | 'weekly' | 'paused') => {
    const newSettings = { ...settings, notificationCadence: value };
    save(newSettings);
    showSuccess(`Notification cadence set to ${value}.`);
  };

  const handleAddFriend = async () => {
    const email = newFriendEmail.trim();
    if (!email) return;

    try {
      await addFriend(email);
      const friends = await getFriends();
      setFriendsList(friends);
      setNewFriendEmail('');
      showSuccess(`Friend request sent to "${email}".`);
    } catch (error) {
      console.error('Failed to add friend:', error);
      showError('Failed to add friend. They might not be registered or already added.');
    }
  };

  const handleAddHerd = () => {
    const name = newHerdName.trim();
    if (name && !settings.herds.some(herd => herd.name === name)) {
      const newHerd: Herd = {
        id: `herd-${Date.now()}`,
        name: name,
        members: [], // Members can be added later
      };
      const newSettings = {
        ...settings,
        herds: [...settings.herds, newHerd],
      };
      save(newSettings);
      setNewHerdName('');
      showSuccess(`Herd "${name}" created.`);
    } else if (settings.herds.some(herd => herd.name === name)) {
      showError(`Herd "${name}" already exists.`);
    }
  };

  const handleRemoveHerd = (herdId: string) => {
    const newSettings = {
      ...settings,
      herds: settings.herds.filter(herd => herd.id !== herdId),
    };
    save(newSettings);
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
              placeholder="Friend's email"
              value={newFriendEmail}
              onChange={(e) => setNewFriendEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFriend()}
            />
            <Button onClick={handleAddFriend}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Friend
            </Button>
          </div>
          <div className="space-y-2">
            {friendsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends added yet.</p>
            ) : (
              friendsList.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <span className="font-medium">{friend.full_name || 'Unnamed'}</span>
                    <span className="text-sm text-muted-foreground ml-2">({friend.email})</span>
                  </div>
                  {/* Remove friend functionality not implemented in backend yet */}
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