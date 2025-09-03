import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import NewIdea from "./components/NewIdea";
import ContentsTable from "./components/ContentsTable";
import EditIdea from "./components/EditIdea";
import NewDraft from "./components/NewDraft";
import ViewDrafts from "./components/ViewDrafts";
import EditDraft from "./components/EditDraft";
import IdeaDetail from "./components/IdeaDetail";
import DraftDetail from "./components/DraftDetail";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import InstallPrompt from "./components/InstallPrompt";

function App() {
  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200">
      <BrowserRouter>
        <AuthProvider>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Navbar />
            <main className="py-6 sm:py-8">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/new-idea" element={<NewIdea />} />
                <Route path="/contents-table" element={<ContentsTable />} />
                <Route path="/idea/:id" element={<IdeaDetail />} />
                <Route path="/edit-idea/:id" element={<EditIdea />} />
                <Route path="/new-draft" element={<NewDraft />} />
                <Route path="/view-drafts" element={<ViewDrafts />} />
                <Route path="/draft/:id" element={<DraftDetail />} />
                <Route path="/edit-draft/:id" element={<EditDraft />} />
                <Route path="/" element={<Login />} />
              </Routes>
            </main>
          </div>

          <InstallPrompt />
          
          <Toaster position="top-center" reverseOrder={false} />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
