import React, { useState, useEffect } from 'react';
import {
  getUser,
  updateUserSettings,
  addFriend,
  getFriends,
  deleteFriend,
  getHerds,
  createHerd,
  deleteHerd,
  addHerdMember,
  removeHerdMember,
  updateHerd
} from '@/lib/api';
import { UserSettings, Herd, Friend, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Users, ChevronLeft, LogOut } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const Settings = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
  });
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  
  // Herds State
  const [herdsList, setHerdsList] = useState<Herd[]>([]);
  const [newHerdName, setNewHerdName] = useState('');
  const [selectedHerd, setSelectedHerd] = useState<Herd | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser();
        setCurrentUser(user);
        if (user.settings) {
          setSettings(user.settings);
        }
        const friends = await getFriends();
        setFriendsList(friends);
        
        const herds = await getHerds();
        setHerdsList(herds);
      } catch (error) {
        console.error('Failed to load settings:', error);
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

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await deleteFriend(friendId);
      const friends = await getFriends();
      setFriendsList(friends);
      showSuccess("Friend removed.");
    } catch (error) {
      console.error('Failed to remove friend:', error);
      showError('Failed to remove friend.');
    }
  };

  // --- HERD MANAGMENT ---

  const refreshHerds = async () => {
    const herds = await getHerds();
    setHerdsList(herds);
    if (selectedHerd) {
      const updatedSelected = herds.find(h => h.id === selectedHerd.id);
      if (updatedSelected) {
        setSelectedHerd(updatedSelected);
      } else {
        setSelectedHerd(null); // Herd was deleted
      }
    }
  };

  const handleCreateHerd = async () => {
    const name = newHerdName.trim();
    if (!name) return;

    try {
      await createHerd(name);
      await refreshHerds();
      setNewHerdName('');
      showSuccess(`Herd "${name}" created.`);
    } catch (error) {
      console.error('Failed to create herd:', error);
      showError('Failed to create herd.');
    }
  };

  const handleDeleteHerd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this herd? This cannot be undone.")) return;
    try {
      await deleteHerd(id);
      await refreshHerds();
      showSuccess('Herd deleted.');
      setSelectedHerd(null);
    } catch (error) {
      console.error('Failed to delete herd:', error);
      showError('Failed to delete herd.');
    }
  };

  const handleAddMember = async () => {
    if (!selectedHerd || !newMemberEmail.trim()) return;
    try {
      await addHerdMember(selectedHerd.id, newMemberEmail.trim());
      await refreshHerds();
      setNewMemberEmail('');
      showSuccess('Member invited.');
    } catch (error) {
      console.error('Failed to add member:', error);
      showError('Failed to add member. Check email and try again.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedHerd) return;
    if (!confirm("Remove this member?")) return;
    try {
      await removeHerdMember(selectedHerd.id, userId);
      await refreshHerds();
      showSuccess('Member removed.');
    } catch (error) {
      console.error('Failed to remove member:', error);
      showError('Failed to remove member.');
    }
  };

  const handleLeaveHerd = async () => {
    if (!selectedHerd || !currentUser) return;
    if (!confirm("Are you sure you want to leave this herd?")) return;
    try {
      await removeHerdMember(selectedHerd.id, currentUser.id);
      await refreshHerds();
      setSelectedHerd(null);
      showSuccess('You left the herd.');
    } catch (error) {
      console.error('Failed to leave herd:', error);
      showError('Failed to leave herd.');
    }
  };
  
  const isOwner = selectedHerd && currentUser && selectedHerd.created_by === currentUser.id;

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
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

      <div className="grid md:grid-cols-2 gap-8">
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
              <Button onClick={handleAddFriend} size="icon" variant="outline">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {friendsList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No friends added yet.</p>
              ) : (
                friendsList.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <div className="font-medium">{friend.full_name || 'Unnamed'}</div>
                      <div className="text-xs text-muted-foreground">{friend.email}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFriend(friend.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Manage Herds (Groups)</CardTitle>
            <CardDescription>Create or remove groups to share with.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedHerd ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New Herd Name"
                    value={newHerdName}
                    onChange={(e) => setNewHerdName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateHerd()}
                  />
                  <Button onClick={handleCreateHerd} size="icon" variant="outline">
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {herdsList.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No herds yet.</p>
                  ) : (
                    herdsList.map((herd) => (
                      <div
                        key={herd.id}
                        className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSelectedHerd(herd)}
                      >
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{herd.name}</div>
                                <div className="text-xs text-muted-foreground">{herd.members.length} members</div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm">Manage</Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedHerd(null)} className="-ml-2">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    {isOwner ? (
                         <Button variant="destructive" size="sm" onClick={() => handleDeleteHerd(selectedHerd.id)}>
                             Delete Herd
                         </Button>
                    ) : (
                        <Button variant="secondary" size="sm" onClick={handleLeaveHerd}>
                            <LogOut className="h-3 w-3 mr-1" /> Leave
                        </Button>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold">{selectedHerd.name}</h3>
                    {selectedHerd.description && <p className="text-sm text-muted-foreground">{selectedHerd.description}</p>}
                </div>

                <Separator />

                <div className="space-y-3">
                    <h4 className="font-medium text-sm">Members</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedHerd.members.map((member) => (
                            <div key={member.user_id} className="flex items-center justify-between text-sm p-2 bg-secondary/20 rounded-md">
                                <div>
                                    <div className="font-medium">{member.full_name || member.email}</div>
                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={member.role === 'owner' ? 'default' : 'outline'}>
                                        {member.role}
                                    </Badge>
                                    {isOwner && member.user_id !== currentUser?.id && (
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveMember(member.user_id)}>
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                         </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Input
                        placeholder="Invite email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                    />
                    <Button onClick={handleAddMember} size="sm">Invite</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;