# School Dude Integration Setup

## Overview

School Dude (now part of Brightly) can sync events to Google Calendar. This knowledge base can then import those events automatically, creating a seamless connection between School Dude and your tech knowledge base.

## How It Works

1. **School Dude → Google Calendar**: School Dude syncs events to your Google Calendar
2. **Google Calendar → Knowledge Base**: The knowledge base imports events from Google Calendar
3. **Event Management**: You can view, organize, and create knowledge base pages from imported events

## Setup Steps

### Step 1: Configure School Dude to Sync with Google Calendar

1. Log into your School Dude FSDirect account
2. Navigate to **Account Setup** > **Account Settings**
3. Scroll to **Google Calendar Integration** section
4. Click **Authorize Google Calendar**
5. Grant permissions when prompted
6. Select the Google Calendar where you want School Dude events to appear

**Note**: You can create a dedicated calendar (e.g., "School Dude Tech Events") or use your primary calendar.

### Step 2: Enable Google Integration in Knowledge Base

1. Go to **Settings** in the knowledge base
2. Toggle **Google Integration** to ON
3. Click **Sign in with Google** and authorize the application
4. Grant permissions for Calendar access

### Step 3: Sync School Dude Events

1. Go to **Settings** > **School Dude Integration**
2. Select the calendar where School Dude syncs events (if you created a dedicated calendar)
3. Click **Sync Events from School Dude**
4. Events will be imported into the knowledge base

## Features

### Automatic Event Import
- Events synced from School Dude appear in the knowledge base
- Events are automatically updated when changed in School Dude
- Duplicate events are prevented

### Event Filtering
The system can filter for tech-related events based on:
- Event title keywords (tech, IT, technology)
- Event description
- Calendar name

You can customize the filtering logic in `/app/api/events/import/route.ts` if needed.

### Event Management
- View all imported events in the **Events** page
- Create knowledge base pages from events
- Organize events by category
- Link events to existing pages

## Troubleshooting

### Events Not Appearing
1. **Check School Dude Sync**: Verify events are appearing in Google Calendar
2. **Check Calendar Selection**: Make sure you selected the correct calendar in the knowledge base
3. **Check Permissions**: Ensure Google Calendar permissions are granted
4. **Check Date Range**: Events are imported for the next 90 days by default

### Duplicate Events
- The system prevents duplicates by checking the Google Calendar event ID
- If you see duplicates, they may be from different calendars

### Filtering Issues
- By default, all events are imported
- To filter for tech events only, uncomment the filtering code in the import route
- Customize keywords in `/app/api/events/import/route.ts`

## Advanced Configuration

### Filtering for Tech Events Only

Edit `/app/api/events/import/route.ts` and uncomment this line:

```typescript
if (!isTechEvent) continue
```

This will only import events that match tech-related keywords.

### Custom Calendar Selection

If School Dude syncs to a specific named calendar:
1. Create a dedicated calendar in Google Calendar
2. Configure School Dude to sync to that calendar
3. Select that calendar in the School Dude Integration settings

## Support

For School Dude setup questions, see:
- [School Dude Google Calendar Integration Documentation](https://help.brightlysoftware.com/Content/Documentation/Facility%20Usage/FSDirect/Advanced%20Setup%20and%20Features/Google%20Calendar%20Integration.htm)

For knowledge base integration issues, check:
- Google Integration status in Settings
- Browser console for error messages
- Server logs for API errors


