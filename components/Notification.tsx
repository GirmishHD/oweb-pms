
import React from 'react';
import { Notification, NotificationType } from '../types';
import { ICONS } from '../constants';

const timeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) + "y ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + "mo ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + "d ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + "h ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + "m ago";
    }
    if(seconds < 10) return "just now";
    return Math.floor(seconds) + "s ago";
};

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case NotificationType.SUCCESS:
            return <span className="text-emerald-500">{ICONS.checkCircle}</span>;
        case NotificationType.ALERT:
            return <span className="text-rose-500">{ICONS.alertTriangle}</span>;
        case NotificationType.NEW_SUBMISSION:
            return <span className="text-cyan-600">{ICONS.planning}</span>;
        case NotificationType.INFO:
        default:
            return <span className="text-sky-500">{ICONS.info}</span>;
    }
};

interface NotificationPanelProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onNotificationClick }) => {
    
    const handleItemClick = (notification: Notification) => {
        if (!notification.isRead) {
            onMarkAsRead(notification.id);
        }
        onNotificationClick(notification);
    }

    return (
        <div className="absolute right-0 mt-3 w-96 max-w-sm bg-white rounded-2xl border border-sky-200 shadow-2xl shadow-cyan-950/20 z-20 animate-fade-in-down overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-sky-100 bg-sky-50/60">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">System Notifications</h3>
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                </div>
                <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-cyan-700 hover:text-cyan-900 hover:underline disabled:text-slate-400 disabled:no-underline font-bold cursor-pointer"
                    disabled={notifications.every(n => n.isRead)}
                    aria-label="Mark all notifications as read"
                >
                    Mark all read
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    <ul className="divide-y divide-sky-50">
                    {notifications.map((notif) => (
                        <li
                            key={notif.id}
                            onClick={() => handleItemClick(notif)}
                            className={`flex items-start p-4 cursor-pointer transition-colors duration-150 ${!notif.isRead ? 'bg-sky-50/70 hover:bg-sky-100/70' : 'hover:bg-slate-50'}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleItemClick(notif)}
                        >
                            {!notif.isRead && <div className="w-2 h-2 bg-cyan-600 rounded-full mt-1.5 mr-3 flex-shrink-0 animate-pulse" aria-label="Unread notification"></div>}
                            <div className={`flex-shrink-0 mr-3.5 ${notif.isRead ? 'ml-5' : ''}`}>
                                {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-grow">
                                <p className="text-xs font-medium text-slate-800 leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-cyan-700 font-semibold mt-1">{timeAgo(notif.timestamp)}</p>
                            </div>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <div className="p-8 text-center text-xs text-slate-400 font-medium">
                        You have no new notifications.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;