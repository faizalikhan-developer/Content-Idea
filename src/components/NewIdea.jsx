import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { saveIdea } from "../utils/db";
import { useNavigate } from "react-router-dom";

function NewIdea() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    contentIdea: "",
    context: "",
    problem: "",
    discovery: "",
    teachingAngle: "",
    code: "",
    hook: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }
    try {
      await saveIdea(user.uid, { ...formData });
      navigate("/contents-table");
    } catch (err) {
      setError("Failed to save idea: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D] mb-6 sm:mb-8">
          New Idea
        </h1>
        {error && (
          <div className="bg-[#4F1C51]/80 text-gray-200 p-3 rounded-md mb-6">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {[
            { label: "Title", name: "title", type: "text", required: true },
            { label: "Content Idea", name: "contentIdea", type: "textarea", rows: 4 },
            { label: "Context", name: "context", type: "textarea", rows: 4 },
            { label: "Problem", name: "problem", type: "textarea", rows: 4 },
            { label: "Discovery", name: "discovery", type: "textarea", rows: 4 },
            { label: "Teaching Angle", name: "teachingAngle", type: "textarea", rows: 4 },
            { label: "Code", name: "code", type: "textarea", rows: 4, font: "font-mono" },
            { label: "Hook", name: "hook", type: "textarea", rows: 4 },
          ].map(({ label, name, type, required, rows, font }) => (
            <div key={name}>
              <label className="block text-sm sm:text-base font-medium text-[#DCA06D] mb-1">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md text-sm sm:text-base ${font || ""} focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50`}
                  rows={rows}
                />
              ) : (
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
                  required={required}
                />
              )}
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              className="bg-[#DCA06D] text-[#210F37] px-4 py-2 rounded-md text-sm sm:text-base font-medium hover:bg-[#A55B4B] hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Save Idea
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="bg-[#4F1C51] text-gray-200 px-4 py-2 rounded-md text-sm sm:text-base font-medium hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewIdea;