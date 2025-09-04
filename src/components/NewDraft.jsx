import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveDraft } from '../utils/db';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Color theme constants for consistency
const THEME = {
  primary: '#DCA06D',
  secondary: '#A55B4B',
  background: '#210F37',
  surface: '#4F1C51',
  text: '#ffffff',
  textMuted: '#e5e7eb',
  error: '#ef4444',
  success: '#10b981',
};

// Markdown toolbar buttons configuration
const TOOLBAR_BUTTONS = [
  { label: 'Bold', syntax: '**text**', shortcut: 'Ctrl+B' },
  { label: 'Italic', syntax: '_text_', shortcut: 'Ctrl+I' },
  { label: 'Code', syntax: '`code`', shortcut: 'Ctrl+`' },
  { label: 'Link', syntax: '[text](url)', shortcut: 'Ctrl+L' },
  { label: 'Image', syntax: '![alt](url)', shortcut: 'Ctrl+Shift+I' },
  { label: 'H1', syntax: '# Heading', shortcut: 'Ctrl+1' },
  { label: 'H2', syntax: '## Heading', shortcut: 'Ctrl+2' },
  { label: 'List', syntax: '- Item', shortcut: 'Ctrl+Shift+L' },
  { label: 'Quote', syntax: '> Quote', shortcut: 'Ctrl+Shift+Q' },
  { label: 'Code Block', syntax: '```\ncode\n```', shortcut: 'Ctrl+Shift+C' },
];

function NewDraft() {
  // Hooks and state management
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [ideaId, setIdeaId] = useState('');
  const [error, setError] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Memoized markdown components for better performance
  const markdownComponents = useMemo(() => ({
    // Enhanced code block with syntax highlighting
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      return !inline ? (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-lg !bg-gray-900 !mt-4 !mb-4"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-800 font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // Enhanced links with external indicator
    a({ node, children, href, ...props }) {
      const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
      return (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 underline break-words transition-colors"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
          {isExternal && (
            <span className="ml-1 text-xs opacity-70">↗</span>
          )}
        </a>
      );
    },
    
    // Responsive images with loading states
    img({ node, alt, src, ...props }) {
      return (
        <div className="my-4">
          <img
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            loading="lazy"
            {...props}
          />
          {alt && (
            <p className="text-center text-sm text-gray-600 mt-2 italic">{alt}</p>
          )}
        </div>
      );
    },
    
    // Enhanced table with better styling
    table({ node, children, ...props }) {
      return (
        <div className="overflow-x-auto my-6">
          <table className="min-w-full border-collapse bg-white rounded-lg shadow-sm" {...props}>
            {children}
          </table>
        </div>
      );
    },
    
    thead({ node, children, ...props }) {
      return (
        <thead className="bg-gray-50" {...props}>
          {children}
        </thead>
      );
    },
    
    th({ node, children, ...props }) {
      return (
        <th
          className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50"
          {...props}
        >
          {children}
        </th>
      );
    },
    
    td({ node, children, ...props }) {
      return (
        <td className="border border-gray-200 px-4 py-3 text-gray-800" {...props}>
          {children}
        </td>
      );
    },
    
    // Enhanced blockquotes with better visual hierarchy
    blockquote({ node, children, ...props }) {
      return (
        <blockquote
          className="border-l-4 border-blue-400 bg-blue-50 pl-6 pr-4 py-3 my-4 italic text-gray-700 rounded-r-lg"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    
    // Consistent heading styles with better spacing
    h1({ node, children, ...props }) {
      return (
        <h1
          className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0 border-b-2 border-gray-200 pb-2"
          {...props}
        >
          {children}
        </h1>
      );
    },
    
    h2({ node, children, ...props }) {
      return (
        <h2
          className="text-2xl font-semibold text-gray-800 mt-6 mb-3 first:mt-0"
          {...props}
        >
          {children}
        </h2>
      );
    },
    
    h3({ node, children, ...props }) {
      return (
        <h3
          className="text-xl font-semibold text-gray-800 mt-5 mb-2 first:mt-0"
          {...props}
        >
          {children}
        </h3>
      );
    },
    
    // Enhanced paragraph with better line spacing
    p({ node, children, ...props }) {
      return (
        <p className="mb-4 leading-7 text-gray-800" {...props}>
          {children}
        </p>
      );
    },
    
    // Improved list styling with better spacing
    ul({ node, children, ...props }) {
      return (
        <ul className="list-disc list-outside ml-6 mb-4 space-y-2" {...props}>
          {children}
        </ul>
      );
    },
    
    ol({ node, children, ...props }) {
      return (
        <ol className="list-decimal list-outside ml-6 mb-4 space-y-2" {...props}>
          {children}
        </ol>
      );
    },
    
    li({ node, children, ...props }) {
      return (
        <li className="text-gray-800 leading-relaxed" {...props}>
          {children}
        </li>
      );
    },
    
    // Task list support for GitHub-flavored markdown
    input({ node, type, checked, ...props }) {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled
            className="mr-2 rounded"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },
    
    // Horizontal rule styling
    hr({ node, ...props }) {
      return <hr className="border-t-2 border-gray-200 my-8" {...props} />;
    },
  }), []);

  // Optimized content change handler
  const handleContentChange = useCallback((e) => {
    setContent(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  }, [error]);

  // Enhanced form submission with loading state
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      await saveDraft(user.uid, { 
        content: content.trim(), 
        ideaId: ideaId ? Number(ideaId) : null 
      });
      navigate('/view-drafts');
    } catch (err) {
      setError(`Failed to save draft: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Toolbar button handler for inserting markdown syntax
  const insertMarkdownSyntax = useCallback((syntax) => {
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText;
    if (syntax.includes('text')) {
      newText = syntax.replace('text', selectedText || 'text');
    } else if (syntax.includes('code')) {
      newText = syntax.replace('code', selectedText || 'code');
    } else if (syntax.includes('url')) {
      newText = syntax.replace('url', 'https://example.com');
    } else if (syntax.includes('Heading')) {
      newText = syntax.replace('Heading', selectedText || 'Heading');
    } else if (syntax.includes('Item')) {
      newText = syntax.replace('Item', selectedText || 'Item');
    } else if (syntax.includes('Quote')) {
      newText = syntax.replace('Quote', selectedText || 'Quote');
    } else {
      newText = syntax;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + newText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e) => {
    if (!e.ctrlKey && !e.metaKey) return;

    const shortcuts = {
      'b': '**text**',
      'i': '_text_',
      '`': '`code`',
      'l': '[text](url)',
      '1': '# Heading',
      '2': '## Heading',
    };

    if (e.shiftKey) {
      const shiftShortcuts = {
        'i': '![alt](url)',
        'l': '- Item',
        'q': '> Quote',
        'c': '```\ncode\n```',
      };
      
      if (shiftShortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        insertMarkdownSyntax(shiftShortcuts[e.key.toLowerCase()]);
      }
    } else if (shortcuts[e.key.toLowerCase()]) {
      e.preventDefault();
      insertMarkdownSyntax(shortcuts[e.key.toLowerCase()]);
    }
  }, [insertMarkdownSyntax]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-3xl font-bold text-amber-300 mb-4 sm:mb-0">
              Markdown Editor
            </h1>
            
            {/* View Toggle Buttons (Mobile) */}
            <div className="flex gap-2 sm:hidden">
              <button
                onClick={() => setIsPreviewMode(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !isPreviewMode 
                    ? 'bg-amber-500 text-purple-900' 
                    : 'bg-purple-700 text-white hover:bg-purple-600'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setIsPreviewMode(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isPreviewMode 
                    ? 'bg-amber-500 text-purple-900' 
                    : 'bg-purple-700 text-white hover:bg-purple-600'
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Idea ID Input */}
          <div className="mb-6">
            <label className="block text-amber-300 font-medium mb-2">
              Related Idea ID (Optional)
            </label>
            <input
              type="number"
              value={ideaId}
              onChange={(e) => setIdeaId(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 bg-purple-800/50 border border-purple-600 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Enter related idea ID"
            />
          </div>
        </header>

        {/* Main Editor Layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar - Hidden on mobile in preview mode */}
          <div className={`mb-4 ${isPreviewMode ? 'hidden sm:block' : 'block'}`}>
            <div className="bg-purple-800/30 backdrop-blur-sm rounded-lg p-3 border border-purple-600/30">
              <div className="flex flex-wrap gap-2">
                {TOOLBAR_BUTTONS.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => insertMarkdownSyntax(button.syntax)}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-md transition-colors font-medium border border-purple-600"
                    title={`${button.label} (${button.shortcut})`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Editor and Preview Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Editor Panel */}
            <div className={`flex flex-col min-h-0 ${isPreviewMode ? 'hidden lg:flex' : 'flex'}`}>
              <label className="block text-amber-300 font-medium mb-3">
                Markdown Content
              </label>
              <div className="flex-1 relative">
                <textarea
                  id="markdown-editor"
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full p-4 bg-purple-900/40 backdrop-blur-sm border border-purple-600/50 rounded-lg text-white placeholder-purple-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="# Welcome to Markdown Editor

Start writing your markdown content here...

## Features:
- **Bold** and _italic_ text
- [Links](https://example.com)
- `inline code` and code blocks
- Lists and tables
- > Blockquotes
- Images and more!

Use the toolbar above or keyboard shortcuts to format your text."
                  style={{ minHeight: '500px' }}
                />
                
                {/* Character count */}
                <div className="absolute bottom-2 right-2 text-xs text-purple-300 bg-purple-900/50 px-2 py-1 rounded">
                  {content.length} characters
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className={`flex flex-col min-h-0 ${!isPreviewMode ? 'hidden lg:flex' : 'flex'}`}>
              <label className="block text-amber-300 font-medium mb-3">
                Live Preview
              </label>
              <div className="flex-1 p-4 bg-white rounded-lg shadow-lg overflow-auto">
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {content || '# Welcome to Markdown Editor\n\nStart writing your markdown content to see the live preview here.\n\n## Features:\n- **Bold** and _italic_ text\n- [Links](https://example.com)\n- `inline code` and code blocks\n- Lists and tables\n- > Blockquotes\n- Images and more!\n\nUse the toolbar above or keyboard shortcuts to format your text.'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <footer className="mt-6 pt-6 border-t border-purple-600/30">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || !content.trim()}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700 disabled:cursor-not-allowed text-purple-900 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-purple-900 flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default NewDraft;