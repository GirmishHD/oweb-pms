import React, { useEffect } from 'react';
import { ICONS } from '../constants';
const Toast = ({ message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000); // Auto-close after 4 seconds
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);
    if (!message) {
        return null;
    }
    return (<div className="fixed top-5 right-5 bg-gray-800 text-white py-3 px-5 rounded-lg shadow-lg flex items-center z-[100] animate-fade-in">
            <span className="w-5 h-5 mr-3 text-primary-300">{ICONS.mail}</span>
            <p className="text-sm font-medium">{message}</p>
            <button onClick={onClose} className="ml-4 text-xl font-light hover:opacity-80">&times;</button>
        </div>);
};
export default Toast;
