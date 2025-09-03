import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getIdeas, deleteIdea } from "../utils/db";
import toast from "react-hot-toast";

function ContentsTable() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchIdeas = async () => {
      setLoading(true);
      try {
        const result = await getIdeas(user.uid, 1, 1000);
        if (result && result.ideas) {
          setIdeas(result.ideas);
        } else {
          setError("Invalid data structure returned from database");
        }
      } catch (err) {
        setError("Failed to load ideas: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchIdeas();
  }, [user]);

  const handleIdeaClick = (idea) => {
    try {
      navigate(`/idea/${idea.id}`);
    } catch (err) {
      setError("Navigation failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    toast.custom((t) => (
      <div className="bg-[#2C2C38] text-gray-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span>Are you sure you want to delete this idea?</span>
        <button
          onClick={async () => {
            try {
              await deleteIdea(Number(id), user.uid);
              setIdeas((prev) => prev.filter((idea) => idea.id !== id));
              toast.dismiss(t.id);
              toast.success("Idea deleted successfully!", {
                style: { background: "#2E7D32", color: "#fff" }, // green success
              });
            } catch (err) {
              toast.dismiss(t.id);
              toast.error("Failed to delete idea: " + err.message, {
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

  const filteredIdeas = useMemo(() => {
    let data = [...ideas];

    if (searchQuery.trim()) {
      data = data.filter((idea) =>
        idea.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (startDate || endDate) {
      data = data.filter((idea) => {
        const ideaDate = new Date(idea.createdAt);
        if (startDate && ideaDate < new Date(startDate)) return false;
        if (endDate && ideaDate > new Date(endDate)) return false;
        return true;
      });
    }

    data.sort((a, b) => {
      let valA =
        sortKey === "title" ? a.title?.toLowerCase() : new Date(a.createdAt);
      let valB =
        sortKey === "title" ? b.title?.toLowerCase() : new Date(b.createdAt);

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [ideas, searchQuery, startDate, endDate, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage);
  const paginatedIdeas = filteredIdeas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center">
        <div className="text-base sm:text-lg">Loading...</div>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center">
        <div className="bg-[#4F1C51]/80 text-gray-200 p-3 rounded-md">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D] mb-6 sm:mb-8">
          Contents
        </h1>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          />
        </div>

        {/* Ideas list */}
        {paginatedIdeas.length === 0 ? (
          <div className="text-center text-gray-400 text-sm sm:text-base">
            No ideas found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedIdeas.map((idea, index) => (
              <div
                key={idea.id || `idea-${index}`}
                className="bg-[#4F1C51] rounded-lg p-4 shadow-md hover:shadow-lg transition-colors duration-200 flex flex-col justify-between"
              >
                <div
                  onClick={() => handleIdeaClick(idea)}
                  className="cursor-pointer flex-1"
                >
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">
                    {idea.createdAt
                      ? new Date(idea.createdAt).toLocaleDateString()
                      : "No date"}
                  </p>
                  <h2 className="text-base sm:text-lg font-medium text-[#DCA06D]">
                    {idea.title || "Untitled"}
                  </h2>
                </div>
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="mt-3 bg-[#A55B4B] text-gray-200 px-3 py-1 rounded-md text-sm sm:text-base font-medium hover:bg-[#210F37] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex gap-3 sm:gap-4 justify-center items-center">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="bg-[#4F1C51] text-gray-200 px-3 py-1 rounded-md text-sm sm:text-base font-medium hover:bg-[#A55B4B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm sm:text-base text-gray-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="bg-[#4F1C51] text-gray-200 px-3 py-1 rounded-md text-sm sm:text-base font-medium hover:bg-[#A55B4B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentsTable;
