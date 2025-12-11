import React, { useEffect, useState } from 'react';
import { getReflections, updateReflection, deleteReflection, getUserSettings } from '@/lib/storage';
import { Reflection, UserSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Frown, Smile, Sparkles, Flag, Lightbulb, Edit, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import EditReflectionDialog from '@/components/EditReflectionDialog'; // Import the new component

const History = () => {
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<Reflection[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(getUserSettings());
  const [filterBy, setFilterBy] = useState<string>('all'); // 'all', 'self', friendId, herdId

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [reflectionToEdit, setReflectionToEdit] = useState<Reflection | null>(null);

  useEffect(() => {
    loadReflections();
    setUserSettings(getUserSettings());
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

  const loadReflections = () => {
    const storedReflections = getReflections();
    setAllReflections(storedReflections.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const handleFlagForFollowUp = (reflectionId: string) => {
    const updatedReflections = allReflections.map(r => {
      if (r.id === reflectionId) {
        return {
          ...r,
          isFlaggedForFollowUp: !r.isFlaggedForFollowUp,
        };
      }
      return r;
    });
    updateReflectionStateAndStorage(updatedReflections);
    const isCurrentlyFlagged = updatedReflections.find(r => r.id === reflectionId)?.isFlaggedForFollowUp;
    showSuccess(isCurrentlyFlagged ? "Reflection flagged for follow-up!" : "Flag removed.");
  };

  const handleEditClick = (reflection: Reflection) => {
    setReflectionToEdit(reflection);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedReflection: Reflection) => {
    updateReflection(updatedReflection); // Update in localStorage
    loadReflections(); // Reload all reflections to update state
    showSuccess("Reflection updated successfully!");
  };

  const handleDeleteReflection = (reflectionId: string) => {
    deleteReflection(reflectionId); // Delete from localStorage
    loadReflections(); // Reload all reflections to update state
    showSuccess("Reflection deleted successfully!");
  };

  const updateReflectionStateAndStorage = (updatedReflections: Reflection[]) => {
    setAllReflections(updatedReflections);
    // This function is used for flagging, which only changes one reflection.
    // We need to ensure the specific reflection is updated in storage, not the whole array.
    // A more robust solution would be to pass the single updated reflection to updateReflection.
    // For now, we'll iterate and update each changed reflection.
    updatedReflections.forEach(r => {
      const original = allReflections.find(orig => orig.id === r.id);
      if (original && (original.isFlaggedForFollowUp !== r.isFlaggedForFollowUp)) {
        updateReflection(r);
      }
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
            {userSettings.friends.map(friend => (
              <SelectItem key={friend} value={friend}>{friend}</SelectItem>
            ))}
            {userSettings.herds.filter(h => h.id !== 'self').map(herd => (
              <SelectItem key={herd.id} value={herd.id}>{herd.name} (Herd)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredReflections.length === 0 ? (
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
                      const friend = userSettings.friends.find(f => f === id);
                      if (friend) return friend;
                      const herd = userSettings.herds.find(h => h.id === id);
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
                    {Object.values(reflection.curiosityReactions).reduce((sum, count) => sum + count, 0) > 0 && (
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        {Object.values(reflection.curiosityReactions).reduce((sum, count) => sum + count, 0)} taps
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