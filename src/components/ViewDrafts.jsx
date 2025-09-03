import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getDrafts, deleteDraft } from "../utils/db";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function ViewDrafts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      try {
        const { drafts } = await getDrafts(user.uid, 1, 500);        
        setDrafts(drafts);
      } catch (err) {        
        setError("Failed to load drafts: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDrafts();
  }, [user]);

  const handleDelete = async (id) => {
    toast.custom((t) => (
      <div className="bg-[#2C2C38] text-gray-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <span>Are you sure you want to delete this draft?</span>
        <button
          onClick={async () => {
            try {
              await deleteDraft(Number(id), user.uid);
              setDrafts((prev) => prev.filter((d) => d.id !== id));
              toast.dismiss(t.id);
              toast.success("Draft deleted successfully!", {
                style: { background: "#2E7D32", color: "#fff" }, // green success
              });
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

  const filteredDrafts = useMemo(() => {
    let data = [...drafts];

    if (startDate || endDate) {
      data = data.filter((draft) => {
        const d = new Date(draft.createdAt);
        if (startDate && d < new Date(startDate)) return false;
        if (endDate && d > new Date(endDate)) return false;
        return true;
      });
    }

    data.sort((a, b) => {
      let valA =
        sortKey === "content"
          ? (a.content || "").toLowerCase()
          : new Date(a.createdAt);
      let valB =
        sortKey === "content"
          ? (b.content || "").toLowerCase()
          : new Date(b.createdAt);

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [drafts, startDate, endDate, sortKey, sortOrder]);

  const totalPages = Math.ceil(filteredDrafts.length / itemsPerPage);
  const paginatedDrafts = filteredDrafts.slice(
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
  if (drafts.length === 0)
    return (
      <div className="min-h-screen bg-[#210F37] text-gray-200 flex items-center justify-center">
        <div className="text-base sm:text-lg">No drafts found</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D] mb-6 sm:mb-8">
          Drafts
        </h1>

        {/* Controls */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 w-full"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 w-full"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 w-full"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="content">Sort by Content</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#4F1C51] text-gray-200 border border-[#A55B4B] rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 w-full"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Drafts list */}
        <div className="space-y-4 sm:space-y-6">
          {paginatedDrafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-[#4F1C51] rounded-lg p-4 sm:p-5 shadow-md hover:shadow-lg transition-colors duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                {/* Content Section - Takes up available space */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">
                    {draft.createdAt
                      ? new Date(draft.createdAt).toLocaleDateString()
                      : "No date"}
                  </p>
                  <p className="text-sm sm:text-base text-gray-200 break-words">
                    {draft.content
                      ? draft.content.slice(0, 100) +
                        (draft.content.length > 100 ? "..." : "")
                      : "(Empty draft)"}
                  </p>
                </div>

                {/* Button Section - Fixed width */}
                <div className="flex gap-2 sm:gap-3 flex-shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => navigate(`/draft/${draft.id}`)}
                    className="px-3 py-1 rounded-md bg-[#DCA06D] text-[#210F37] text-sm sm:text-base font-medium hover:bg-[#A55B4B] hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 whitespace-nowrap"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="px-3 py-1 rounded-md bg-[#A55B4B] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#210F37] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex gap-3 sm:gap-4 justify-center items-center flex-wrap">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 rounded-md bg-[#4F1C51] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#A55B4B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm sm:text-base text-gray-200 whitespace-nowrap">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 rounded-md bg-[#4F1C51] text-gray-200 text-sm sm:text-base font-medium hover:bg-[#A55B4B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewDrafts;
