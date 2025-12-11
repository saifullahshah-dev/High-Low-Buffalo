import React, { useEffect, useState } from 'react';
import { getReflections } from '@/lib/storage';
import { Reflection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Frown, Smile, Sparkles } from 'lucide-react';

const History = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);

  useEffect(() => {
    const storedReflections = getReflections();
    // Sort by timestamp descending
    setReflections(storedReflections.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

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
      {reflections.length === 0 ? (
        <p className="text-center text-muted-foreground">No reflections yet. Share your first High, Low, and Buffalo!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reflections.map((reflection) => (
            <Card key={reflection.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{format(new Date(reflection.timestamp), 'PPP')}</span>
                  <Badge variant="secondary" className="text-xs">
                    Shared with: {reflection.sharedWith.length > 0 ? reflection.sharedWith.join(', ') : 'Self'}
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
                {Object.keys(reflection.curiosityReactions).length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Curiosity reactions: {Object.values(reflection.curiosityReactions).reduce((sum, count) => sum + count, 0)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;