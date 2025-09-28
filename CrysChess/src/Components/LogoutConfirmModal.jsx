import React from "react";
import "./LogoutConfirmModal.css"

export default function LogoutConfirmModal({ 
    isOpen, 
    onCancel, 
    onConfirm, 
    message = "Are you sure you want to logout?" 
}) {
    if (!isOpen) return null; // modal hidden if not open

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2 className="modal-title">Confirm Logout</h2>
                <p className="modal-message">{message}</p>
                <div className="modal-buttons">
                    <button className="lgbtn lgbtn-outline" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="lgbtn lgbtn-danger" onClick={onConfirm}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
