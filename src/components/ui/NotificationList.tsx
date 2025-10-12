import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const NotificationList = () => {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
