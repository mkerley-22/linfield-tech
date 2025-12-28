# Preview Setup Complete! 🎉

Your knowledge base is now running locally.

## Access the Application

**Local URL:** http://localhost:3000

Open this URL in your browser to see the knowledge base in action.

## What You Can Do Now

### 1. Create Your First Page
- Click "New Page" on the home page
- Enter a title (e.g., "Network Setup Guide")
- Write content or use the AI Assistant
- Click "Save Page"

### 2. Try the AI Assistant
- In the page editor, find the "AI Writing Assistant" section
- Enter a prompt like: "Write an introduction about network troubleshooting"
- Click "Generate Content"
- Review and insert the generated content

**Note:** AI features require an OpenAI API key. Add it to `.env`:
```
OPENAI_API_KEY="sk-your-key-here"
```
Then restart the server.

### 3. Upload Files
- After creating/saving a page, scroll to "Attachments"
- Drag and drop files or click to select
- Supports: PDFs, images, videos, schematics

### 4. Search
- Use the search bar at the top
- Search by title, description, or content

## Server Commands

- **Stop Server:** Press `Ctrl+C` in the terminal
- **Restart Server:** Run `npm run dev` again
- **View Database:** Run `npm run db:studio` (in a new terminal)

## Next Steps

1. **Add OpenAI API Key** (optional, for AI features):
   - Get a key from https://platform.openai.com/
   - Add to `.env` file
   - Restart the server

2. **Create Content:**
   - Start adding pages for your tech documentation
   - Organize with parent-child relationships
   - Add tags for categorization

3. **Customize:**
   - Edit pages in `app/` directory
   - Modify styles in `app/globals.css`
   - Adjust components in `components/`

## Troubleshooting

- **Port 3000 in use?** The server will automatically use the next available port
- **Database issues?** Run `npx prisma db push` to reset
- **Need to restart?** Stop the server (Ctrl+C) and run `npm run dev` again

Enjoy your knowledge base! 🚀


