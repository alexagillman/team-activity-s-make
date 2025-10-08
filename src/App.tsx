import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Edit, Trash2 } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { activityCollection } from '@/lib/data';
import type { z } from 'zod';
import type { activity } from '@/lib/data';

type Activity = z.infer<typeof activity> & { _id: string };

const WEEKDAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
] as const;

function ActivityForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState<string>('');
  const [time, setTime] = useState('');
  const queryClient = useQueryClient();

  const createActivity = useMutation({
    mutationFn: (data: Omit<Activity, '_id'>) => activityCollection.insert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity added successfully!');
      setTitle('');
      setDescription('');
      setDay('');
      setTime('');
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to add activity');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !day || !time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const now = Date.now();
    createActivity.mutate({
      title: title.trim(),
      description: description.trim(),
      day: day as any,
      time,
      createdAt: now,
      updatedAt: now,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Activity Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter activity title"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter activity description (optional)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="day">Day *</Label>
        <Select value={day} onValueChange={setDay} required>
          <SelectTrigger id="day">
            <SelectValue placeholder="Select a day" />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((weekday) => (
              <SelectItem key={weekday.key} value={weekday.key}>
                {weekday.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="time">Time *</Label>
        <Input
          id="time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={createActivity.isPending}>
        {createActivity.isPending ? 'Adding...' : 'Add Activity'}
      </Button>
    </form>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(activity.title);
  const [editDescription, setEditDescription] = useState(activity.description || '');
  const [editTime, setEditTime] = useState(activity.time);
  const queryClient = useQueryClient();

  const updateActivity = useMutation({
    mutationFn: (data: Partial<Omit<Activity, '_id'>>) => 
      activityCollection.update(activity._id, { ...data, updatedAt: Date.now() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity updated!');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update activity');
    }
  });

  const deleteActivity = useMutation({
    mutationFn: () => activityCollection.delete(activity._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success('Activity deleted!');
    },
    onError: () => {
      toast.error('Failed to delete activity');
    }
  });

  const handleUpdate = () => {
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    updateActivity.mutate({
      title: editTitle.trim(),
      description: editDescription.trim(),
      time: editTime,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this activity?')) {
      deleteActivity.mutate();
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Activity title"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
            />
            <Input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleUpdate} disabled={updateActivity.isPending}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm leading-tight">{activity.title}</h4>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  disabled={deleteActivity.isPending}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-1 mb-2">
              <Clock size={12} className="text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {activity.time}
              </Badge>
            </div>
            
            {activity.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activity.description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DayColumn({ day, activities }: { day: typeof WEEKDAYS[number], activities: Activity[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dayActivities = activities
    .filter(activity => activity.day === day.key)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{day.label}</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus size={14} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
              </DialogHeader>
              <ActivityForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {dayActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-2">No activities scheduled</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus size={14} className="mr-1" />
                  Add Activity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Activity</DialogTitle>
                </DialogHeader>
                <ActivityForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-3">
            {dayActivities.map((activity) => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function App() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityCollection.getAll(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Team Activity Scheduler</h1>
            <p className="text-muted-foreground mt-2">Loading your weekly schedule...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {WEEKDAYS.map((day) => (
              <Card key={day.key} className="h-64 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 font-['Inter']">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Team Activity Scheduler</h1>
          <p className="text-muted-foreground mt-2">
            Organize your team's activities across the week
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {WEEKDAYS.map((day) => (
            <DayColumn
              key={day.key}
              day={day}
              activities={activities}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;