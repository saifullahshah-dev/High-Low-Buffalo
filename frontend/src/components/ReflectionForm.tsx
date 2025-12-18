import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createReflection, getUser, getFriends, getHerds } from '@/lib/api';
import { ReflectionCreate, UserSettings, Friend, Herd } from '@/types';
import { showSuccess, showError } from '@/utils/toast';
import { Frown, Smile, Sparkles, Loader2, Image as ImageIcon, X } from 'lucide-react';

const ReflectionForm = () => {
  const [high, setHigh] = useState('');
  const [low, setLow] = useState('');
  const [buffalo, setBuffalo] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [sharedWith, setSharedWith] = useState<string>('self'); // 'self', 'friendId', 'herdId'
  const [userSettings, setUserSettings] = useState<UserSettings>({
    notificationCadence: 'daily',
  });
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [herdsList, setHerdsList] = useState<Herd[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getUser();
        if (user.settings) {
          setUserSettings(user.settings);
        }
        const friends = await getFriends();
        setFriendsList(friends);
        const herds = await getHerds();
        setHerdsList(herds);
      } catch (error) {
        console.error('Failed to load user settings, friends, or herds:', error);
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showError("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!high.trim() || !low.trim() || !buffalo.trim()) {
      showError("Please fill in all three reflection fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newReflection: ReflectionCreate = {
        high: high.trim(),
        low: low.trim(),
        buffalo: buffalo.trim(),
        sharedWith: [sharedWith],
        image: image || undefined,
      };

      await createReflection(newReflection);

      showSuccess("Your reflection has been shared!");
      setHigh('');
      setLow('');
      setBuffalo('');
      setImage(null);
      setSharedWith('self');
    } catch (error) {
      console.error("Failed to create reflection:", error);
      showError("Failed to share reflection. Please try again.");
    } finally {
      setIsSubmitting(false);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Share Your Day</CardTitle>
        <CardDescription className="text-center">What was your High, Low, and Buffalo moment?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="high" className="flex items-center gap-2">
              {getIcon('high')} High
            </Label>
            <Textarea
              id="high"
              placeholder="What was the best part of your day?"
              value={high}
              onChange={(e) => setHigh(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="low" className="flex items-center gap-2">
              {getIcon('low')} Low
            </Label>
            <Textarea
              id="low"
              placeholder="What was challenging or difficult?"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buffalo" className="flex items-center gap-2">
              {getIcon('buffalo')} Buffalo
            </Label>
            <Textarea
              id="buffalo"
              placeholder="What was surprising, random, or unexpected?"
              value={buffalo}
              onChange={(e) => setBuffalo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {!image ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-20 border-dashed"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <ImageIcon className="mr-2 h-6 w-6 text-muted-foreground" />
                    <span className="text-muted-foreground">Add a photo</span>
                  </Button>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={image}
                      alt="Preview"
                      className="h-20 w-auto object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shareWith">Share With</Label>
            <Select value={sharedWith} onValueChange={setSharedWith}>
              <SelectTrigger id="shareWith">
                <SelectValue placeholder="Select who to share with" />
              </SelectTrigger>
              <SelectContent>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              'Share Reflection'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReflectionForm;