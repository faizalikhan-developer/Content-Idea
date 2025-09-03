import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveDraft } from '../utils/db';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

function NewDraft() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [ideaId, setIdeaId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    try {
      await saveDraft(user.uid, { content, ideaId: ideaId ? Number(ideaId) : null });
      navigate('/view-drafts');
    } catch (err) {
      setError('Failed to save draft: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col">
      <div className="mx-auto max-w-7xl flex-1 flex flex-col">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D] mb-4">
            New Draft
          </h1>
          {error && (
            <div className="bg-[#4F1C51]/80 text-gray-200 p-3 rounded-md mb-4 sm:mb-6">
              {error}
            </div>
          )}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
              Related Idea ID (Optional)
            </label>
            <input
              type="number"
              value={ideaId}
              onChange={(e) => setIdeaId(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
              placeholder="Enter related idea ID"
            />
          </div>
        </div>

        {/* Main Editor Layout */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0">
            {/* Editor Panel */}
            <div className="flex flex-col min-h-0">
              <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
                Markdown Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 p-3 sm:p-4 bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md text-sm sm:text-base font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
                placeholder="Write your Markdown content here..."
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Preview Panel */}
            <div className="flex flex-col min-h-0">
              <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
                Preview
              </label>
              <div className="flex-1 p-3 sm:p-4 bg-white rounded-md overflow-auto">
                <div className="prose prose-sm max-w-none break-words text-gray-800">
                  <ReactMarkdown
                    components={{
                      code: ({ node, inline, className, children, ...props }) => (
                        inline ? (
                          <code
                            className="bg-[#4F1C51]/10 px-1 py-0.5 rounded text-sm text-[#210F37]"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-[#4F1C51]/10 p-3 rounded overflow-x-auto text-[#210F37]">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        )
                      ),
                      a: ({ node, children, ...props }) => (
                        <a
                          className="text-[#A55B4B] hover:text-[#DCA06D] underline break-all"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      img: ({ node, ...props }) => (
                        <img
                          className="max-w-full h-auto rounded shadow-md"
                          {...props}
                        />
                      ),
                      table: ({ node, children, ...props }) => (
                        <div className="overflow-x-auto">
                          <table
                            className="min-w-full border-collapse border border-[#A55B4B]/30"
                            {...props}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ node, children, ...props }) => (
                        <th
                          className="border border-[#A55B4B]/30 px-4 py-2 bg-[#4F1C51]/10 text-left text-[#210F37]"
                          {...props}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ node, children, ...props }) => (
                        <td
                          className="border border-[#A55B4B]/30 px-4 py-2 text-[#210F37]"
                          {...props}
                        >
                          {children}
                        </td>
                      ),
                      blockquote: ({ node, children, ...props }) => (
                        <blockquote
                          className="border-l-4 border-[#A55B4B] pl-4 italic text-gray-600 my-4"
                          {...props}
                        >
                          {children}
                        </blockquote>
                      ),
                      h1: ({ node, children, ...props }) => (
                        <h1
                          className="text-2xl font-semibold text-[#DCA06D] mt-6 mb-4 first:mt-0"
                          {...props}
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ node, children, ...props }) => (
                        <h2
                          className="text-xl font-semibold text-[#DCA06D] mt-5 mb-3 first:mt-0"
                          {...props}
                        >
                          {children}
                        </h2>
                      ),
                      h3: ({ node, children, ...props }) => (
                        <h3
                          className="text-lg font-semibold text-[#DCA06D] mt-4 mb-2 first:mt-0"
                          {...props}
                        >
                          {children}
                        </h3>
                      ),
                      p: ({ node, children, ...props }) => (
                        <p
                          className="mb-4 leading-relaxed break-words text-gray-800"
                          {...props}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ node, children, ...props }) => (
                        <ul
                          className="list-disc list-inside mb-4 space-y-1 text-gray-800"
                          {...props}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ node, children, ...props }) => (
                        <ol
                          className="list-decimal list-inside mb-4 space-y-1 text-gray-800"
                          {...props}
                        >
                          {children}
                        </ol>
                      ),
                      li: ({ node, children, ...props }) => (
                        <li className="break-words text-gray-800" {...props}>
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {content || '*Write something to see the preview...*'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-[#A55B4B]/30 bg-[#210F37]">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md bg-[#DCA06D] text-[#210F37] text-sm sm:text-base font-medium hover:bg-[#A55B4B] hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-md bg-[#4F1C51] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewDraft;