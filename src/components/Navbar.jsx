import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user } = useAuth();

  if (!user) return null; // hide navbar if not logged in

  return (
    <nav className="bg-[#210F37] shadow-md px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap gap-4 sm:gap-6 border-b border-[#4F1C51]">
      <Link
        to="/dashboard"
        className="text-[#DCA06D] hover:text-[#A55B4B] font-medium text-sm sm:text-base transition-colors duration-200"
      >
        Dashboard
      </Link>
      <Link
        to="/contents-table"
        className="text-[#DCA06D] hover:text-[#A55B4B] font-medium text-sm sm:text-base transition-colors duration-200"
      >
        Ideas
      </Link>
      <Link
        to="/view-drafts"
        className="text-[#DCA06D] hover:text-[#A55B4B] font-medium text-sm sm:text-base transition-colors duration-200"
      >
        Drafts
      </Link>
      <Link
        to="/new-idea"
        className="text-[#DCA06D] hover:text-[#A55B4B] font-medium text-sm sm:text-base transition-colors duration-200"
      >
        New Idea
      </Link>
      <Link
        to="/new-draft"
        className="text-[#DCA06D] hover:text-[#A55B4B] font-medium text-sm sm:text-base transition-colors duration-200"
      >
        New Draft
      </Link>
    </nav>
  );
}

export default Navbar;