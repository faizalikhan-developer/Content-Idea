import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDrafts, updateDraft, deleteDraft } from "../utils/db";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

function DraftDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState("preview"); // 'preview', 'raw', 'split'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDraft = async () => {
      setLoading(true);
      try {
        const { drafts } = await getDrafts(user.uid, 1, 100);
        const found = drafts.find((d) => d.id === Number(id));
        setDraft(found);
        setFormData(found);
      } catch (err) {
        setError("Failed to load draft: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDraft();
  }, [user, id]);

  const handleSave = async () => {
    try {
      await updateDraft(Number(id), user.uid, formData);
      setDraft({ ...draft, ...formData });
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update draft: " + err.message);
    }
  };

const handleDelete = async () => {
  toast.custom((t) => (
    <div className="bg-[#2C2C38] text-gray-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <span>Are you sure you want to delete this draft?</span>
      <button
        onClick={async () => {
          try {
            await deleteDraft(Number(id), user.uid);
            toast.dismiss(t.id);
            toast.success("Draft deleted successfully!", {
              style: { background: "#2E7D32", color: "#fff" }, // green success
            });
            navigate("/view-drafts");
          } catch (err) {
            toast.dismiss(t.id);
            toast.error("Failed to delete draft: " + err.message, {
              style: { background: "#B71C1C", color: "#fff" }, // red error
            });
          }
        }}
        className="bg-[#A55B4B] hover:bg-[#210F37] px-3 py-1 rounded-md text-sm font-medium"
      >
        Yes
      </button>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium"
      >
        No
      </button>
    </div>
  ));
};

  if (loading)
    return (
      <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center">
        <div className="text-base sm:text-lg">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center">
        <div className="bg-[#4F1C51]/80 text-gray-200 p-3 rounded-md max-w-md mx-4 text-center">
          {error}
        </div>
      </div>
    );
  if (!draft)
    return (
      <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center">
        <div className="text-base sm:text-lg">Draft not found</div>
      </div>
    );

  const currentContent = isEditing
    ? formData.content || ""
    : draft.content || "";

  const renderMarkdownPreview = (content) => (
    <div className="prose prose-sm max-w-none break-words text-gray-800 overflow-hidden">
      <ReactMarkdown
        components={{
          code: ({ node, inline, className, children, ...props }) =>
            inline ? (
              <code
                className="bg-[#4F1C51]/10 px-1 py-0.5 rounded text-sm text-[#210F37] break-all"
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
            <img className="max-w-full h-auto rounded shadow-md" {...props} />
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
              className="border border-[#A55B4B]/30 px-4 py-2 text-[#210F37] break-words"
              {...props}
            >
              {children}
            </td>
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote
              className="border-l-4 border-[#A55B4B] pl-4 italic text-gray-600 my-4 break-words"
              {...props}
            >
              {children}
            </blockquote>
          ),
          h1: ({ node, children, ...props }) => (
            <h1
              className="text-2xl font-semibold text-[#DCA06D] mt-6 mb-4 first:mt-0 break-words"
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2
              className="text-xl font-semibold text-[#DCA06D] mt-5 mb-3 first:mt-0 break-words"
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3
              className="text-lg font-semibold text-[#DCA06D] mt-4 mb-2 first:mt-0 break-words"
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
        {content || "*Empty draft*"}
      </ReactMarkdown>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D] mb-4 break-words">
            Draft Detail
          </h1>

          {/* Draft Info */}
          <div className="mb-4 text-sm sm:text-base text-gray-400">
            <p className="break-words">Draft ID: {draft.id}</p>
            {draft.ideaId && (
              <p className="break-words">Related Idea ID: {draft.ideaId}</p>
            )}
            {draft.createdAt && (
              <p className="break-words">
                Created: {new Date(draft.createdAt).toLocaleString()}
              </p>
            )}
            {draft.updatedAt && (
              <p className="break-words">
                Updated: {new Date(draft.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* View Mode Toggle - Only show when not editing */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              {["preview", "raw", "split"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm sm:text-base font-medium transition-colors duration-200 whitespace-nowrap ${
                    viewMode === mode
                      ? "bg-[#A55B4B] text-gray-200"
                      : "bg-[#4F1C51] text-gray-200 hover:bg-[#A55B4B] focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="mb-6">
          {isEditing ? (
            /* Editing Mode - Stack on mobile, side-by-side on desktop */
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
              <div className="w-full min-w-0">
                <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
                  Edit Content
                </label>
                <textarea
                  value={formData.content || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="w-full h-96 lg:h-[500px] p-3 sm:p-4 bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md text-sm sm:text-base font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
                />
              </div>
              <div className="w-full min-w-0">
                <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
                  Preview
                </label>
                <div className="w-full h-96 lg:h-[500px] p-3 sm:p-4 bg-white rounded-md overflow-auto">
                  {renderMarkdownPreview(formData.content)}
                </div>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {viewMode === "preview" && (
                <div className="w-full min-w-0">
                  <div className="w-full min-h-96 p-3 sm:p-4 bg-white rounded-md overflow-auto">
                    {renderMarkdownPreview(currentContent)}
                  </div>
                </div>
              )}
              {viewMode === "raw" && (
                <div className="w-full min-w-0">
                  <div className="w-full min-h-96 p-3 sm:p-4 bg-[#4F1C51] rounded-md overflow-auto">
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm sm:text-base text-gray-200">
                      {currentContent || "(Empty draft)"}
                    </pre>
                  </div>
                </div>
              )}
              {viewMode === "split" && (
                <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
                  <div className="w-full min-w-0">
                    <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
                      Raw Markdown
                    </label>
                    <div className="w-full h-96 lg:h-[500px] p-3 sm:p-4 bg-[#4F1C51] rounded-md overflow-auto">
                      <pre className="whitespace-pre-wrap break-words font-mono text-sm sm:text-base text-gray-200">
                        {currentContent || "(Empty draft)"}
                      </pre>
                    </div>
                  </div>
                  <div className="w-full min-w-0">
                    <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-2">
                      Preview
                    </label>
                    <div className="w-full h-96 lg:h-[500px] p-3 sm:p-4 bg-white rounded-md overflow-auto">
                      {renderMarkdownPreview(currentContent)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4 border-t border-[#A55B4B]/30">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-md bg-[#DCA06D] text-[#210F37] text-sm sm:text-base font-medium hover:bg-[#A55B4B] hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 whitespace-nowrap"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-[#A55B4B] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#4F1C51] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 whitespace-nowrap"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(draft); // reset
                }}
                className="px-4 py-2 rounded-md bg-[#4F1C51] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-md bg-[#4F1C51] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 whitespace-nowrap"
          >
            Delete
          </button>
          <Link
            to="/view-drafts"
            className="px-4 py-2 rounded-md bg-[#A55B4B] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#DCA06D] hover:text-[#210F37] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            Back to Drafts
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DraftDetail;
