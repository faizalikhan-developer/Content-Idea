import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getPendingSync,
  updateIdea,
  updateDraft,
  syncFromCloud,
  replaceLocalWithCloud,
} from "../utils/db";
import db from "../utils/db";
import {
  pushIdeas,
  pushDrafts,
  syncIdeas,
  syncDrafts,
  updateIdeaSyncStatus,
  updateDraftSyncStatus,
} from "../utils/firebase";

function Dashboard() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Debug function (enhanced)
  const debugDatabaseState = async () => {
    try {
      const allIdeas = await db.ideas.where({ userId: user.uid }).toArray();
      const allDrafts = await db.drafts.where({ userId: user.uid }).toArray();

      console.log("=== DATABASE DEBUG ===");
      console.log("All Ideas:", allIdeas);
      console.log("All Drafts:", allDrafts);

      const { pendingIdeas, pendingDrafts } = await getPendingSync(user.uid);
      console.log("Pending Ideas Count:", pendingIdeas.length);
      console.log("Pending Drafts Count:", pendingDrafts.length);

      console.log("Ideas by sync status:");
      const ideaStats = allIdeas.reduce((acc, idea) => {
        acc[idea.syncStatus] = (acc[idea.syncStatus] || 0) + 1;
        return acc;
      }, {});
      console.log(ideaStats);

      console.log("Drafts by sync status:");
      const draftStats = allDrafts.reduce((acc, draft) => {
        acc[draft.syncStatus] = (acc[draft.syncStatus] || 0) + 1;
        return acc;
      }, {});
      console.log(draftStats);

      toast.success("Database state logged to console");
    } catch (err) {
      console.error("Debug error:", err);
      toast.error("Failed to debug database state");
    }
  };

  const handlePush = async () => {
    if (isLoading) return;

    const loadingToast = toast.loading("Pushing changes to cloud...");

    try {
      setIsLoading(true);

      const { pendingIdeas, pendingDrafts } = await getPendingSync(user.uid);

      if (pendingIdeas.length === 0 && pendingDrafts.length === 0) {
        toast.dismiss(loadingToast);
        toast.success("No data to push", {
          icon: "ℹ️",
        });
        return;
      }

      if (pendingIdeas.length > 0) {
        const ideaResults = await pushIdeas(user.uid, pendingIdeas);
        for (let i = 0; i < ideaResults.length; i++) {
          const { cloudId, action } = ideaResults[i];
          const localIdea = pendingIdeas[i];

          if (action === "deleted") {
            // Hard delete from local after successful cloud deletion
            await db.ideas
              .where({ id: localIdea.id, userId: user.uid })
              .delete();
          } else {
            // Update sync status for created items
            await updateIdea(localIdea.id, user.uid, {
              syncStatus: "synced",
              cloudId,
            });
            await updateIdeaSyncStatus(cloudId, "synced");
          }
        }
      }

      if (pendingDrafts.length > 0) {
        const draftResults = await pushDrafts(user.uid, pendingDrafts);
        for (let i = 0; i < draftResults.length; i++) {
          const { cloudId, action } = draftResults[i];
          const localDraft = pendingDrafts[i];

          if (action === "deleted") {
            // Hard delete from local after successful cloud deletion
            await db.drafts
              .where({ id: localDraft.id, userId: user.uid })
              .delete();
          } else {
            // Update sync status for created/updated items
            await updateDraft(localDraft.id, user.uid, {
              syncStatus: "synced",
              cloudId,
            });
            await updateDraftSyncStatus(cloudId, "synced");
          }
        }
      }

      toast.dismiss(loadingToast);
      toast.success(
        `Successfully pushed ${pendingIdeas.length} ideas and ${pendingDrafts.length} drafts to the cloud`,
        {
          duration: 4000,
          icon: "✅",
        }
      );
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(`Failed to push changes: ${err.message}`, {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (isLoading) return;

    const loadingToast = toast.loading("Syncing data from cloud...");

    try {
      setIsLoading(true);

      console.log("Starting sync process...");

      const { pendingIdeas, pendingDrafts } = await getPendingSync(user.uid);

      if (pendingIdeas.length > 0 || pendingDrafts.length > 0) {
        toast.dismiss(loadingToast);
        toast.error(
          `Cannot sync: push ${pendingIdeas.length} pending ideas and ${pendingDrafts.length} pending drafts first`,
          {
            duration: 6000,
            icon: "⚠️",
          }
        );
        return;
      }

      console.log("Fetching data from cloud...");
      const [cloudIdeas, cloudDrafts] = await Promise.all([
        syncIdeas(user.uid),
        syncDrafts(user.uid),
      ]);

      console.log(
        `Fetched ${cloudIdeas.length} ideas and ${cloudDrafts.length} drafts from cloud`
      );

      console.log("Syncing cloud data to local database...");
      await syncFromCloud(user.uid, {
        ideas: cloudIdeas,
        drafts: cloudDrafts,
      });

      toast.dismiss(loadingToast);
      toast.success(
        `Successfully synced ${cloudIdeas.length} ideas and ${cloudDrafts.length} drafts from the cloud`,
        {
          duration: 4000,
          icon: "🔄",
        }
      );

      console.log("Sync completed successfully");
    } catch (err) {
      console.error("Sync error:", err);
      toast.dismiss(loadingToast);
      toast.error(`Failed to sync data: ${err.message}`, {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    if (isLoading) return;

    const confirmed = window.confirm(
      "⚠️ FORCE SYNC will replace ALL local data with cloud data. This cannot be undone. Continue?"
    );

    if (!confirmed) return;

    const loadingToast = toast.loading("Force syncing data from cloud...");

    try {
      setIsLoading(true);

      console.log("Starting force sync...");

      const [cloudIdeas, cloudDrafts] = await Promise.all([
        syncIdeas(user.uid),
        syncDrafts(user.uid),
      ]);

      console.log(
        `Force syncing ${cloudIdeas.length} ideas and ${cloudDrafts.length} drafts`
      );

      await replaceLocalWithCloud(user.uid, {
        ideas: cloudIdeas,
        drafts: cloudDrafts,
      });

      toast.dismiss(loadingToast);
      toast.success(
        `Force sync completed: ${cloudIdeas.length} ideas and ${cloudDrafts.length} drafts loaded from cloud`,
        {
          duration: 4000,
          icon: "🔄",
        }
      );

      console.log("Force sync completed successfully");
    } catch (err) {
      console.error("Force sync error:", err);
      toast.dismiss(loadingToast);
      toast.error(`Failed to force sync: ${err.message}`, {
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#DCA06D]">
            Dashboard
          </h1>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span className="text-[#DCA06D] font-medium text-sm sm:text-base">
              {user?.displayName || "User"}
            </span>
            <button
              onClick={logout}
              className="bg-[#A55B4B] text-gray-200 px-4 py-2 rounded-md text-sm sm:text-base font-medium hover:bg-[#4F1C51] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link
            to="/new-idea"
            className="bg-[#4F1C51] text-[#DCA06D] text-center py-3 sm:py-4 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            New Idea
          </Link>
          <Link
            to="/contents-table"
            className="bg-[#4F1C51] text-[#DCA06D] text-center py-3 sm:py-4 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            Contents Table
          </Link>
          <Link
            to="/new-draft"
            className="bg-[#4F1C51] text-[#DCA06D] text-center py-3 sm:py-4 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            New Draft
          </Link>
          <Link
            to="/view-drafts"
            className="bg-[#4F1C51] text-[#DCA06D] text-center py-3 sm:py-4 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            View Drafts
          </Link>
          <button
            onClick={handlePush}
            disabled={isLoading}
            className="bg-[#A55B4B] text-gray-200 py-3 sm:py-4 rounded-md font-medium text-sm sm:text-base hover:bg-[#4F1C51] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Push Changes"}
          </button>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="bg-[#DCA06D] text-[#210F37] py-3 sm:py-4 rounded-md font-medium text-sm sm:text-base hover:bg-[#A55B4B] hover:text-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Syncing..." : "Sync Data"}
          </button>
        </div>

        {/* Additional Sync Options */}
        {/* <div className="mt-6 sm:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleForceSync}
              disabled={isLoading}
              className="bg-red-600 text-gray-200 px-4 py-2 rounded-md text-sm sm:text-base font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Processing..." : "⚠️ Force Sync (Replace All)"}
            </button>
            <button
              onClick={debugDatabaseState}
              disabled={isLoading}
              className="bg-[#4F1C51] text-gray-200 px-4 py-2 rounded-md text-sm sm:text-base font-medium hover:bg-[#A55B4B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Debug Database State
            </button>
          </div>
        </div> */}

        {/* Sync Status Info */}
        <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-400">
          <p>
            <strong>Sync:</strong> Downloads cloud data and merges with local
            (requires no pending changes)
          </p>
          {/* <p><strong>Force Sync:</strong> Replaces ALL local data with cloud data (use when local data is corrupted)</p> */}
          <p>
            <strong>Push:</strong> Uploads local changes to cloud
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
