# Google Drive & Calendar Integration Setup

## Prerequisites

1. Google Cloud Project with APIs enabled
2. OAuth 2.0 credentials

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Drive API
   - Google Calendar API

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# For production, update GOOGLE_REDIRECT_URI to your production URL
```

### 4. Connect Google Account

1. Go to **Settings** in the knowledge base
2. Click **Connect Google Account**
3. Authorize the application
4. You'll be redirected back to settings

## Features

### Google Drive Integration

- **Link Drive Files**: Link individual Drive files to pages or categories
- **Folder Sync**: Create Drive folders for categories and sync files automatically
- **Two-way Sync**: Files added in Drive appear in the knowledge base
- **File Browser**: Browse and link files from your Drive

### Calendar Integration

- **Import Events**: Import events from Google Calendar
- **Event Pages**: Automatically create pages for events
- **Event Dashboard**: View upcoming tech events
- **Event Categories**: Organize events by category
- **Recurring Events**: Support for recurring meetings and training

## Usage

### Drive Integration

1. **Link a Drive Folder to a Category**:
   - Go to a category page
   - Scroll to "Google Drive Integration"
   - Create or link a Drive folder
   - Enable auto-sync to automatically import files

2. **Link Drive Files to Pages**:
   - Edit a page
   - Scroll to "Google Drive Files"
   - Link files from your Drive

3. **Sync Drive Folder**:
   - Click "Sync" button on category page
   - All files in the linked folder will be imported

### Calendar Integration

1. **Import Events**:
   - Go to **Events** page
   - Click **Import from Google Calendar**
   - Select a calendar (or use primary)
   - Events will be imported and displayed

2. **Create Event Page**:
   - Click **Create Page** on any event
   - A knowledge base page will be created for the event
   - Add notes, documentation, and resources

3. **View Upcoming Events**:
   - Events widget on homepage shows next 3 events
   - Full events page shows all upcoming events
   - Events are organized by category

## API Endpoints

### Drive
- `GET /api/drive/files?folderId=xxx` - List files in folder
- `POST /api/drive/files` - Link a Drive file
- `GET /api/drive/folders?categoryId=xxx` - Get folder for category
- `POST /api/drive/folders` - Create/link Drive folder
- `POST /api/drive/sync` - Sync folder files

### Events
- `GET /api/events?upcoming=true` - Get upcoming events
- `POST /api/events` - Create event
- `POST /api/events/import` - Import from Google Calendar
- `GET /api/events/import` - List available calendars
- `POST /api/events/[id]/create-page` - Create page for event

## Troubleshooting

### OAuth Errors
- Verify redirect URI matches exactly
- Check that APIs are enabled in Google Cloud Console
- Ensure credentials are correct in `.env`

### Drive Sync Issues
- Verify Google account is connected
- Check folder permissions in Drive
- Ensure folder ID is correct

### Calendar Import Issues
- Verify Calendar API is enabled
- Check calendar sharing settings
- Ensure events are in the selected calendar

## Security Notes

- OAuth tokens are stored securely in the database
- Tokens are automatically refreshed when expired
- Only authorized users can access Drive and Calendar data
- Consider implementing user authentication for production use

