'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { Button } from './ui/Button'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none px-4 py-2',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Link URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive('bold') ? 'active' : 'default'}
          size="sm"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive('italic') ? 'active' : 'default'}
          size="sm"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          variant={editor.isActive('heading', { level: 1 }) ? 'active' : 'default'}
          size="sm"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          variant={editor.isActive('heading', { level: 2 }) ? 'active' : 'default'}
          size="sm"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          variant={editor.isActive('heading', { level: 3 }) ? 'active' : 'default'}
          size="sm"
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          variant={editor.isActive('bulletList') ? 'active' : 'default'}
          size="sm"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          variant={editor.isActive('orderedList') ? 'active' : 'default'}
          size="sm"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button onClick={addLink} variant="default" size="sm">
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button onClick={addImage} variant="default" size="sm">
          <ImageIcon className="w-4 h-4" />
        </Button>
      </div>
      <EditorContent editor={editor} className="min-h-[400px] max-h-[600px] overflow-y-auto" />
    </div>
  )
}

