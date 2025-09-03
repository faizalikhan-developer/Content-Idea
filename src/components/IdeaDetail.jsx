import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getIdeaById, updateIdea } from "../utils/db";
import { useAuth } from "../context/AuthContext";

function IdeaDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchIdea = async () => {
      setLoading(true);
      try {
        const data = await getIdeaById(id);
        setIdea(data);
        setFormData(data); // initialize form with existing data
      } catch (err) {
        setError("Failed to load idea: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIdea();
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateIdea(Number(id), user.uid, formData);
      setIdea({ ...idea, ...formData }); // update local state
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update idea: " + err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-base sm:text-lg">Loading...</div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="bg-[#4F1C51]/80 text-gray-200 p-3 rounded-md">{error}</div>
    </div>
  );
  if (!idea) return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-base sm:text-lg">No idea found</div>
    </div>
  );

  const fields = [
    ["Content Idea", "contentIdea"],
    ["Date", "createdAt", true], // readonly
    ["Context", "context"],
    ["Problem", "problem"],
    ["Discovery", "discovery"],
    ["Teaching Angle", "teachingAngle"],
    ["Code", "code"],
    ["Hook", "hook"],
    ["Title", "title"],
  ];

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D] mb-6 sm:mb-8">
          Idea Details
        </h1>

        <div className="bg-[#4F1C51] rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full">
            <tbody>
              {fields.map(([label, key, readOnly]) => (
                <tr key={key} className="border-b border-[#A55B4B]/50">
                  <td className="px-4 sm:px-6 py-3 font-medium bg-[#210F37]/50 w-1/4">
                    {label}
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    {isEditing && !readOnly ? (
                      <input
                        type="text"
                        value={formData[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="bg-[#210F37] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
                      />
                    ) : key === "createdAt" ? (
                      <span className="text-gray-400">
                        {new Date(idea[key]).toDateString()}
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base">
                        {idea[key] || "-"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#4F1C51] text-[#DCA06D] px-4 py-2 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="bg-[#A55B4B] text-gray-200 px-4 py-2 rounded-md font-medium text-sm sm:text-base hover:bg-[#4F1C51] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(idea); // reset changes
                }}
                className="bg-[#4F1C51] text-[#DCA06D] px-4 py-2 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          <Link
            to="/contents-table"
            className="text-[#DCA06D] hover:text-[#A55B4B] text-sm sm:text-base transition-colors duration-200"
          >
            ← Back to Contents
          </Link>
        </div>
      </div>
    </div>
  );
}

export default IdeaDetail;