# Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="sk-your-key-here"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Initialize database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Create your first page:**
   - Click "New Page" from the home page
   - Enter a title (e.g., "Network Setup Guide")
   - Optionally use the AI Assistant to generate content
   - Click "Save Page"

2. **Add attachments:**
   - After saving, scroll to the Attachments section
   - Drag and drop files or click to select
   - Supported: PDFs, images, videos, schematics

3. **Organize content:**
   - Create parent pages for categories
   - Create child pages for specific topics
   - Use tags to categorize pages

## AI Assistant Setup

The AI Assistant requires an OpenAI API key:

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Create an API key
3. Add it to your `.env` file
4. Restart the development server

**Note:** AI features will be disabled if no API key is provided, but the rest of the application will work normally.

## File Uploads

- Maximum file size: 100MB per file
- Supported types: All file types
- Files are stored in `public/uploads/`
- Files are automatically organized by type (document, image, video, schematic)

## Troubleshooting

### Database Issues
```bash
# Reset database (WARNING: Deletes all data)
rm prisma/dev.db
npx prisma db push
```

### Port Already in Use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Prisma Client Not Generated
```bash
npx prisma generate
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables in your hosting platform

3. Run migrations:
   ```bash
   npx prisma db push
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Recommended Hosting

- **Vercel** - Best for Next.js (automatic deployments)
- **Railway** - Easy database setup
- **DigitalOcean** - Full control
- **AWS** - Enterprise scale


