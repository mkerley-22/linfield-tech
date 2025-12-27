# Linfield Tech Knowledge Base

A modern, AI-powered knowledge base for Linfield Christian School in Temecula, CA. Built with Next.js 14, TypeScript, and Prisma.

<!-- Deployment trigger -->

## Features

- 📝 **Rich Text Editor** - Create and edit pages with a powerful WYSIWYG editor
- 🤖 **AI Writing Assistant** - Generate content with OpenAI integration
- 📎 **File Attachments** - Upload documents, images, videos, and schematics
- 🔍 **Search** - Full-text search across all pages
- 📚 **Page Hierarchy** - Organize content with parent-child relationships
- 🏷️ **Tags** - Categorize and organize pages with tags
- 🎨 **Modern UI** - Clean, intuitive interface inspired by Notion and Obsidian

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Rich Text Editor**: Tiptap
- **AI**: OpenAI GPT-4
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for AI features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Page

1. Click "New Page" from the main pages view
2. Enter a title and optional description
3. Use the AI Assistant to generate content, or write manually
4. Add attachments (documents, images, videos, schematics)
5. Click "Save Page"

### Using AI Assistant

1. In the page editor, find the AI Writing Assistant section
2. Describe what you want to write (e.g., "Write an introduction about network troubleshooting")
3. Click "Generate Content"
4. Review the generated content and click "Insert into Editor" to add it

### Uploading Files

1. In the page editor, scroll to the Attachments section
2. Drag and drop files or click to select
3. Supported file types: documents, images, videos, schematics
4. Maximum file size: 100MB

### Searching

1. Use the search bar at the top of any page
2. Search by title, description, or content
3. Results are displayed with page titles and descriptions

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── pages/        # Page CRUD operations
│   │   ├── ai/           # AI content generation
│   │   └── upload/       # File upload handling
│   ├── pages/            # Page views and editor
│   ├── search/           # Search page
│   └── settings/         # Settings page
├── components/           # React components
│   ├── RichTextEditor.tsx
│   ├── AIAssistant.tsx
│   ├── FileUpload.tsx
│   └── Sidebar.tsx
├── lib/                  # Utility functions
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
└── prisma/
    └── schema.prisma     # Database schema
```

## Database Schema

- **Page**: Main content pages with hierarchical structure
- **Attachment**: Files attached to pages
- **Tag**: Tags for categorizing pages
- **PageTag**: Many-to-many relationship between pages and tags

## Development

### Database Management

- View database: `npm run db:studio`
- Push schema changes: `npm run db:push`
- Generate Prisma client: `npm run db:generate`

### Building for Production

```bash
npm run build
npm start
```

## Features Inspired By

- **Notion** - Clean UI and page organization
- **Obsidian** - Knowledge base structure and linking
- **Confluence** - Team knowledge base approach
- **GitBook** - Documentation-focused design

## License

Private - Linfield Christian School

## Support

For issues or questions, please contact the IT department at Linfield Christian School.

