import React, { useEffect } from "react";
import "./Alert.css";

export default function Alert({ type = "info", message, onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration && onClose) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <div className={`alert alert-${type}`}>
            <span>{message}</span>
            <button className="alert-close" onClick={onClose}>×</button>
        </div>
    );
}
