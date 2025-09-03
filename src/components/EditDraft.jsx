import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getDrafts, updateDraft } from "../utils/db";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function EditDraft() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [ideaId, setIdeaId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const { drafts } = await getDrafts(user.uid, 1, 1, { id: Number(id) });
        if (drafts.length > 0) {
          setContent(drafts[0].content);
          setIdeaId(drafts[0].ideaId || "");
        } else {
          setError("Draft not found");
        }
      } catch (err) {
        setError("Failed to load draft: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDraft();
  }, [user, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    try {
      await updateDraft(Number(id), user.uid, {
        content,
        ideaId: ideaId ? Number(ideaId) : null,
      });
      navigate("/view-drafts");
    } catch (err) {
      setError("Failed to update draft: " + err.message);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Draft</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 mb-2">Markdown Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows="10"
            placeholder="Write your Markdown content here..."
          />
          <div className="mt-4">
            <label className="block text-gray-700 mb-2">
              Related Idea ID (Optional)
            </label>
            <input
              type="number"
              value={ideaId}
              onChange={(e) => setIdeaId(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter related idea ID"
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 mb-2">Preview</label>
          <div className="p-4 border rounded bg-white min-h-[10rem]">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
        >
          Update Draft
        </button>
        <button
          onClick={() => navigate("/view-drafts")}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default EditDraft;
