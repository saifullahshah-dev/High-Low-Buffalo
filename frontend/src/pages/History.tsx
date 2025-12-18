import React, { useEffect, useState } from 'react';
import { getReflections, updateReflection, deleteReflection, getUser, flagReflection, getFriends, getHerds } from '@/lib/api';
import { Reflection, UserSettings, ReflectionUpdate, Friend, Herd } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Frown, Smile, Sparkles, Flag, Lightbulb, Edit, Trash2, Loader2, Share2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import EditReflectionDialog from '@/components/EditReflectionDialog'; // Import the new component

const History = () => {
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<Reflection[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
  });
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [herdsList, setHerdsList] = useState<Herd[]>([]);
  const [filterBy, setFilterBy] = useState<string>('all'); // 'all', 'self', friendId, herdId
  const [isLoading, setIsLoading] = useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [reflectionToEdit, setReflectionToEdit] = useState<Reflection | null>(null);

  useEffect(() => {
    loadReflections();
    getUser().then(user => {
      if (user.settings) setUserSettings(user.settings);
    }).catch(console.error);
    getFriends().then(setFriendsList).catch(console.error);
    getHerds().then(setHerdsList).catch(console.error);
  }, []);

  useEffect(() => {
    let currentFiltered = allReflections;
    if (filterBy === 'self') {
      currentFiltered = allReflections.filter(r => r.sharedWith.includes('self'));
    } else if (filterBy !== 'all') {
      currentFiltered = allReflections.filter(r => r.sharedWith.includes(filterBy));
    }
    setFilteredReflections(currentFiltered);
  }, [filterBy, allReflections]);

  const loadReflections = async () => {
    setIsLoading(true);
    try {
      const storedReflections = await getReflections();
      setAllReflections(storedReflections.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error("Failed to load reflections:", error);
      showError("Failed to load reflections.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlagForFollowUp = async (reflectionId: string) => {
    const reflection = allReflections.find(r => r.id === reflectionId);
    if (!reflection) return;

    try {
      const updatedReflection = await flagReflection(reflectionId);

      setAllReflections(prev => prev.map(r => r.id === reflectionId ? updatedReflection : r));
      showSuccess(updatedReflection.isFlaggedForFollowUp ? "Reflection flagged for follow-up!" : "Flag removed.");
    } catch (error) {
      console.error("Failed to flag reflection:", error);
      showError("Failed to update flag status.");
    }
  };

  const handleEditClick = (reflection: Reflection) => {
    setReflectionToEdit(reflection);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedReflection: Reflection) => {
    try {
      const updateData: ReflectionUpdate = {
        high: updatedReflection.high,
        low: updatedReflection.low,
        buffalo: updatedReflection.buffalo,
        sharedWith: updatedReflection.sharedWith,
      };

      const result = await updateReflection(updatedReflection.id, updateData);
      setAllReflections(prev => prev.map(r => r.id === result.id ? result : r));
      showSuccess("Reflection updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update reflection:", error);
      showError("Failed to update reflection.");
    }
  };

  const handleDeleteReflection = async (reflectionId: string) => {
    try {
      await deleteReflection(reflectionId);
      setAllReflections(prev => prev.filter(r => r.id !== reflectionId));
      showSuccess("Reflection deleted successfully!");
    } catch (error) {
      console.error("Failed to delete reflection:", error);
      showError("Failed to delete reflection.");
    }
  };

  const handleShare = (reflection: Reflection) => {
    const text = `High: ${reflection.high}\nLow: ${reflection.low}\nBuffalo: ${reflection.buffalo}\n\nShared via High-Low-Buffalo`;
    navigator.clipboard.writeText(text).then(() => {
      showSuccess("Copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy:", err);
      showError("Failed to copy to clipboard.");
    });
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Reflection History</h1>

      <div className="mb-6 flex items-center gap-4 justify-center">
        <Label htmlFor="filterBy" className="text-lg">Filter by:</Label>
        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger id="filterBy" className="w-[180px]">
            <SelectValue placeholder="All Reflections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reflections</SelectItem>
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

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredReflections.length === 0 ? (
        <p className="text-center text-muted-foreground">No reflections found for this filter.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReflections.map((reflection) => (
            <Card key={reflection.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{format(new Date(reflection.timestamp), 'PPP')}</span>
                  <Badge variant="secondary" className="text-xs">
                    Shared with: {reflection.sharedWith.length > 0 ? reflection.sharedWith.map(id => {
                      if (id === 'self') return 'Self';
                      const friend = friendsList.find(f => f.id === id);
                      if (friend) return friend.full_name || friend.email;
                      const herd = herdsList.find(h => h.id === id);
                      if (herd) return herd.name;
                      return id; // Fallback if ID not found
                    }).join(', ') : 'Self'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(reflection.timestamp), 'p')}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                {reflection.image && (
                  <div className="mb-2">
                    <img
                      src={reflection.image}
                      alt="Reflection attachment"
                      className="rounded-md w-full object-cover max-h-64"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-1">
                    {getIcon('high')} High:
                  </h3>
                  <p className="text-sm text-muted-foreground">{reflection.high}</p>
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-1">
                    {getIcon('low')} Low:
                  </h3>
                  <p className="text-sm text-muted-foreground">{reflection.low}</p>
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-1">
                    {getIcon('buffalo')} Buffalo:
                  </h3>
                  <p className="text-sm text-muted-foreground">{reflection.buffalo}</p>
                </div>
                <div className="mt-auto flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(reflection)}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-2"
                      title="Copy to clipboard"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {Object.values(reflection.curiosityReactions).reduce((sum, userIds) => sum + userIds.length, 0) > 0 && (
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        {Object.values(reflection.curiosityReactions).reduce((sum, userIds) => sum + userIds.length, 0)} taps
                      </span>
                    )}
                    <Button
                      variant={reflection.isFlaggedForFollowUp ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFlagForFollowUp(reflection.id)}
                      className="flex items-center gap-1"
                    >
                      <Flag className="h-4 w-4" />
                      Flag
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(reflection)}>
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your reflection.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteReflection(reflection.id)}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reflectionToEdit && (
        <EditReflectionDialog
          reflection={reflectionToEdit}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default History;