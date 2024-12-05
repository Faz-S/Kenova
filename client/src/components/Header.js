import React, { useState } from 'react';

function Header() {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('Education');

    const handleTitleEdit = () => {
        setIsEditing(true);
    };

    const handleTitleSave = (e) => {
        if (e.key === 'Enter' || e.type === 'blur') {
            setIsEditing(false);
        }
    };

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="logo-section">
                    <img src="/assets/Edusage-logo.png" alt="Edusage
                    " className="logo" />
                    <div className="title-section">
                        {isEditing ? (
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={handleTitleSave}
                                onBlur={handleTitleSave}
                                className="title-input"
                                autoFocus
                            />
                        ) : (
                            <div className="title-display">
                                <h1>{title}</h1>
                                <button 
                                    className="edit-title-btn"
                                    onClick={handleTitleEdit}
                                    aria-label="Edit title"
                                >
                                    ✏️
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="header-actions">
                    <button className="new-session-btn">+ New Session</button>
                </div>
            </div>
        </header>
    );
}

export default Header;