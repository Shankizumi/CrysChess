import React, { useEffect, useState } from "react";
import "./WinnerModal.css";

export default function WinnerModal({ winner, onFinish }) {
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (countdown === 0) {
            onFinish(); // redirect
        }
    }, [countdown, onFinish]);

    return (
        <div className="winner-modal-overlay">
            <div className="winner-modal">
                <h2>🎉 Winner: {winner}</h2>
                <p>Redirecting in {countdown} seconds...</p>
            </div>
        </div>
    );
}
