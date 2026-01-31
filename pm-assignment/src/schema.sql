-- Feedback Dashboard D1 Schema

CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,           -- discord, github, email, twitter, manual
    source_id TEXT,                 -- original ID from source (null for manual)
    title TEXT,
    content TEXT NOT NULL,
    sentiment TEXT,                 -- positive, negative, neutral
    sentiment_score REAL,           -- 0.0 to 1.0 confidence
    urgency TEXT,                   -- critical, high, medium, low
    themes TEXT,                    -- JSON array of themes
    summary TEXT,                   -- AI-generated summary
    status TEXT DEFAULT 'inbox',    -- inbox, reviewing, planned, done
    created_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_urgency ON feedback(urgency);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
