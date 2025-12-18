import React, { useEffect, useState } from 'react';
import { getFeed, reactToReflection, getUser } from '@/lib/api';
import { Reflection, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Frown, Smile, Sparkles, Lightbulb, Loader2, Share2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Feed = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [feedData, userData] = await Promise.all([getFeed(), getUser()]);
      setReflections(feedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setCurrentUser(userData);
    } catch (error) {
      console.error("Failed to load feed:", error);
      showError("Failed to load feed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReact = async (reflectionId: string) => {
    try {
      const updatedReflection = await reactToReflection(reflectionId, 'curious');
      setReflections(prev => prev.map(r => r.id === reflectionId ? updatedReflection : r));
    } catch (error) {
      console.error("Failed to react:", error);
      showError("Failed to update reaction.");
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

  const getReactionCount = (reflection: Reflection) => {
     if (!reflection.curiosityReactions) return 0;
     return Object.values(reflection.curiosityReactions).reduce((acc, userIds) => acc + userIds.length, 0);
  };

  const hasUserReacted = (reflection: Reflection) => {
    if (!currentUser || !reflection.curiosityReactions) return false;
    return Object.values(reflection.curiosityReactions).some(userIds => userIds.includes(currentUser.id));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Community Feed</h1>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : reflections.length === 0 ? (
        <p className="text-center text-muted-foreground">No shared reflections yet. Add some friends!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reflections.map((reflection) => (
            <Card key={reflection.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex flex-col gap-1">
                  <span className="text-sm font-normal text-muted-foreground">Shared by: <span className="font-semibold text-foreground">{reflection.author_name || 'Unknown'}</span></span>
                  <span>{format(new Date(reflection.timestamp), 'PPP')}</span>
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
                <div className="mt-auto pt-4 border-t flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(reflection)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    title="Copy to clipboard"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={hasUserReacted(reflection) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleReact(reflection.id)}
                    className="flex items-center gap-2"
                  >
                    <Lightbulb className={`h-4 w-4 ${hasUserReacted(reflection) ? 'fill-current' : ''}`} />
                    {getReactionCount(reflection)}
                    <span className="sr-only">Reactions</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;