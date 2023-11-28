CREATE TABLE recent_workspaces (
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    last_opened INTEGER NOT NULL
) STRICT;
