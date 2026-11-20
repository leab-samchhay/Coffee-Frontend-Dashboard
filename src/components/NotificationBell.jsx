import { useState, useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios'; // បញ្ចូល axios សម្រាប់ហៅ API

window.Pusher = Pusher;
const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    }
});

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    
    const user = JSON.parse(localStorage.getItem('user')); 
    const userId = user ? user.id : null;

    useEffect(() => {
        if (!userId) return;

        // ហៅ API ពិនិត្យស្តុក និងបង្កើត Notification ចូល DB ពេលបើក App
        axios.get('http://localhost:8000/api/check-stock-notifications', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        .then(() => {
            // បន្ទាប់មក ទាញយកបញ្ជី Notification មកបង្ហាញ
            return axios.get('http://localhost:8000/api/my-notifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        })
        .then(response => {
            setNotifications(response.data.notifications);
        })
        .catch(error => {
            console.error("Error:", error);
        });

    }, [userId]);

    

    // រាប់ចំនួន Notification ដែលមិនទាន់អាន (IsRead == 0 ឬ false)
    const unreadCount = notifications.filter(n => n.IsRead === 0 || n.IsRead === false).length;

    return (
        <div className="notification-wrapper" style={{ position: 'relative', cursor: 'pointer' }}>
            <span>🔔</span>
            {unreadCount > 0 && (
                <span className="badge" style={{ background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px', position: 'absolute', top: -5, right: -10 }}>
                    {unreadCount}
                </span>
            )}
        </div>
    );
}