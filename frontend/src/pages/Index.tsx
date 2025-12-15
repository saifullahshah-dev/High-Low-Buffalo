import React, { useState, useEffect } from 'react';
import ReflectionForm from '@/components/ReflectionForm';
import { getReflections, updateReflection } from '@/lib/api';
import { Reflection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Frown, Smile, Sparkles, Lightbulb, Flag, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Index = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReflections = async () => {
    setIsLoading(true);
    try {
      const data = await getReflections();
      // Show only the most recent 3 reflections on the home page
      setReflections(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch reflections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReflections();
  }, []);

  const handleCuriosityTap = async (reflectionId: string) => {
    const reflectionToUpdate = reflections.find(r => r.id === reflectionId);
    if (!reflectionToUpdate) return;

    const currentCount = reflectionToUpdate.curiosityReactions[reflectionId] || 0;
    const updatedReactions = {
      ...reflectionToUpdate.curiosityReactions,
      [reflectionId]: currentCount + 1,
    };

    try {
      const updatedReflection = await updateReflection(reflectionId, {
        curiosityReactions: updatedReactions
      });

      setReflections(prev => prev.map(r => r.id === reflectionId ? updatedReflection : r));
      showSuccess("Curiosity noted! You can ask more about this later.");
    } catch (error) {
      console.error("Failed to update curiosity tap:", error);
      showError("Failed to update curiosity tap.");
    }
  };

  const handleFlagForFollowUp = async (reflectionId: string) => {
    const reflectionToUpdate = reflections.find(r => r.id === reflectionId);
    if (!reflectionToUpdate) return;

    const newFlagStatus = !reflectionToUpdate.isFlaggedForFollowUp;

    try {
      const updatedReflection = await updateReflection(reflectionId, {
        isFlaggedForFollowUp: newFlagStatus
      });

      setReflections(prev => prev.map(r => r.id === reflectionId ? updatedReflection : r));
      showSuccess(newFlagStatus ? "Reflection flagged for follow-up!" : "Flag removed.");
    } catch (error) {
      console.error("Failed to update flag status:", error);
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
    <div className="container mx-auto py-8 space-y-12">
      <ReflectionForm />

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Recent Reflections</h2>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : reflections.length === 0 ? (
          <p className="text-center text-muted-foreground">No recent reflections. Share your first High, Low, and Buffalo!</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reflections.map((reflection) => (
              <Card key={reflection.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{formatDistanceToNow(new Date(reflection.timestamp), { addSuffix: true })}</span>
                    <span className="text-sm text-muted-foreground">
                      {reflection.sharedWith.includes('self') ? 'Private' : reflection.sharedWith.join(', ')}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {formatDistanceToNow(new Date(reflection.timestamp), { addSuffix: true })}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCuriosityTap(reflection.id)}
                        className="flex items-center gap-1"
                      >
                        <Lightbulb className="h-4 w-4" />
                        Curiosity Tap
                      </Button>
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
                    {(reflection.curiosityReactions[reflection.id] || 0) > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {(reflection.curiosityReactions[reflection.id] || 0)} taps
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;