import React, { useEffect, useState } from 'react';
import { getReflections, updateReflection, getUser } from '@/lib/api';
import { Reflection, UserSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Frown, Smile, Sparkles, Flag, Lightbulb, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const FollowUp = () => {
  const [followUpReflections, setFollowUpReflections] = useState<Reflection[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
    herds: [],
    friends: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFollowUpReflections();
    getUser().then(user => {
      if (user.settings) setUserSettings(user.settings);
    }).catch(console.error);
  }, []);

  const loadFollowUpReflections = async () => {
    setIsLoading(true);
    try {
      const allStoredReflections = await getReflections();
      const filtered = allStoredReflections
        .filter(r => r.isFlaggedForFollowUp || Object.values(r.curiosityReactions).reduce((sum, count) => sum + count, 0) > 0)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setFollowUpReflections(filtered);
    } catch (error) {
      console.error("Failed to load follow-up reflections:", error);
      showError("Failed to load reflections.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFlag = async (reflectionId: string) => {
    const reflection = followUpReflections.find(r => r.id === reflectionId);
    if (!reflection) return;

    try {
      const updatedReflection = await updateReflection(reflectionId, {
        isFlaggedForFollowUp: !reflection.isFlaggedForFollowUp
      });

      setFollowUpReflections(prev => prev.map(r => r.id === reflectionId ? updatedReflection : r));
      showSuccess(updatedReflection.isFlaggedForFollowUp ? "Reflection flagged for follow-up!" : "Flag removed.");
    } catch (error) {
      console.error("Failed to toggle flag:", error);
      showError("Failed to update flag status.");
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Follow-up Reminders</h1>
      <p className="text-center text-muted-foreground mb-8">Reflections you've flagged or received curiosity taps on.</p>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : followUpReflections.length === 0 ? (
        <p className="text-center text-muted-foreground">No reflections currently flagged for follow-up or with curiosity taps.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {followUpReflections.map((reflection) => (
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
                <CardDescription className="text-sm">
                  {format(new Date(reflection.timestamp), 'p')}
                </CardDescription>
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
                      onClick={() => handleToggleFlag(reflection.id)}
                      className="flex items-center gap-1"
                    >
                      <Flag className="h-4 w-4" />
                      {reflection.isFlaggedForFollowUp ? "Unflag" : "Flag"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUp;