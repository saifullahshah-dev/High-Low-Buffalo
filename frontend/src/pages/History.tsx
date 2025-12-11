import React, { useEffect, useState } from 'react';
import { getReflections, getUserSettings } from '@/lib/storage';
import { Reflection, UserSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Frown, Smile, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const History = () => {
  const [allReflections, setAllReflections] = useState<Reflection[]>([]);
  const [filteredReflections, setFilteredReflections] = useState<Reflection[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>(getUserSettings());
  const [filterBy, setFilterBy] = useState<string>('all'); // 'all', 'self', friendId, herdId

  useEffect(() => {
    const storedReflections = getReflections();
    // Sort by timestamp descending
    setAllReflections(storedReflections.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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
                {Object.values(reflection.curiosityReactions).reduce((sum, count) => sum + count, 0) > 0 && (
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