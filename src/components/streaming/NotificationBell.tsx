import { useState, useEffect, useRef } from 'react';
import { Bell, X, Sparkles, Bug, Megaphone, Film, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'update' | 'bugfix' | 'new_content' | 'new_video';
  media_id?: string;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get or create session ID
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('gctv-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('gctv-session-id', sessionId);
    }
    return sessionId;
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    const { data: globalNotifications, error: globalError } = await supabase
      .from('notifications')
      .select('*')
      .is('session_id', null)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (globalError) {
      console.error('Error fetching global notifications:', globalError);
    }

    // Check localStorage for read status
    const readIds = JSON.parse(localStorage.getItem('gctv-read-notifications') || '[]');
    
    const allNotifications = (globalNotifications || []).map(n => ({
      ...n,
      is_read: readIds.includes(n.id),
    })) as Notification[];
    
    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(n => !n.is_read).length);
    
    // If selected notification was deleted, go back to list
    if (selectedNotification && !allNotifications.find(n => n.id === selectedNotification.id)) {
      setSelectedNotification(null);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedNotification(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all as read
  const markAllAsRead = () => {
    const readIds = notifications.map(n => n.id);
    localStorage.setItem('gctv-read-notifications', JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Mark single as read
  const markAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem('gctv-read-notifications') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('gctv-read-notifications', JSON.stringify(readIds));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle notification click - open detail view
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  // Go back to list
  const handleBackToList = () => {
    setSelectedNotification(null);
  };

  // Get icon for notification type
  const getIcon = (type: string, size: number = 14) => {
    switch (type) {
      case 'update':
        return <Megaphone size={size} className="text-blue-400" />;
      case 'bugfix':
        return <Bug size={size} className="text-green-400" />;
      case 'new_content':
        return <Sparkles size={size} className="text-purple-400" />;
      case 'new_video':
        return <Film size={size} className="text-primary" />;
      default:
        return <Bell size={size} className="text-muted-foreground" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'update':
        return 'Mise à jour';
      case 'bugfix':
        return 'Correction de bug';
      case 'new_content':
        return 'Nouveau contenu';
      case 'new_video':
        return 'Nouvelle vidéo';
      default:
        return 'Notification';
    }
  };

  // Format time ago
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins}m`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  // Format full date
  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSelectedNotification(null);
        }}
        className="rounded-xl text-muted-foreground hover:text-foreground relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-secondary/30">
            {selectedNotification ? (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} />
                Retour
              </button>
            ) : (
              <h3 className="font-bold text-foreground text-sm">Notifications</h3>
            )}
            <div className="flex items-center gap-2">
              {!selectedNotification && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedNotification(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content - either detail view or list */}
          {selectedNotification ? (
            // Detail View
            <ScrollArea className="max-h-[450px]">
              <div className="p-4 space-y-4">
                {/* Type badge and icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                    {getIcon(selectedNotification.type, 20)}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                    {getTypeLabel(selectedNotification.type)}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-foreground leading-tight">
                  {selectedNotification.title}
                </h2>

                {/* Full message */}
                <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>

                {/* Date */}
                <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/30">
                  {formatFullDate(selectedNotification.created_at)}
                </p>
              </div>
            </ScrollArea>
          ) : (
            // List View
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Bell size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-border/20 cursor-pointer transition-colors ${
                      notification.is_read ? 'bg-transparent' : 'bg-primary/5'
                    } hover:bg-secondary/50`}
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-semibold truncate ${notification.is_read ? 'text-foreground/70' : 'text-foreground'}`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {timeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;