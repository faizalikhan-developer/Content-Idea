import Dexie from "dexie";

const db = new Dexie("ContentIdeaLoggerDB");

// Optimized schema with proper indexes for better query performance
db.version(1).stores({
  ideas:
    "++id,userId,createdAt,title,contentIdea,context,problem,discovery,teachingAngle,code,hook,syncStatus,cloudId,[userId+syncStatus],[userId+createdAt]",
  drafts:
    "++id,userId,createdAt,content,ideaId,syncStatus,cloudId,[userId+syncStatus],[userId+createdAt]",
});

// Cache for frequent queries to reduce database hits
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEYS = {
  PENDING_SYNC: "pendingSync",
  IDEAS_COUNT: "ideasCount",
  DRAFTS_COUNT: "draftsCount",
};

// Helper function to generate cache key
function getCacheKey(prefix, ...args) {
  return `${prefix}_${args.join("_")}`;
}

// Helper function to check cache validity
function isCacheValid(cacheEntry) {
  return cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_TTL;
}

// Helper function to set cache
function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Helper function to get from cache
function getCache(key) {
  const entry = cache.get(key);
  return isCacheValid(entry) ? entry.data : null;
}

// Debounce function for search operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Batch operations helper
class BatchOperations {
  constructor() {
    this.operations = [];
    this.timeout = null;
  }

  add(operation) {
    this.operations.push(operation);

    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.flush();
      }, 100); // Batch operations within 100ms
    }
  }

  async flush() {
    if (this.operations.length === 0) return;

    const ops = [...this.operations];
    this.operations = [];
    this.timeout = null;

    try {
      await db.transaction("rw", db.ideas, db.drafts, async () => {
        await Promise.all(ops);
      });
    } catch (error) {
      console.error("Batch operation failed:", error);
    }
  }
}

const batchOps = new BatchOperations();

export async function saveIdea(userId, ideaData) {
  // Clear related cache entries
  const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  const countKey = getCacheKey(CACHE_KEYS.IDEAS_COUNT, userId);
  cache.delete(pendingSyncKey);
  cache.delete(countKey);

  return await db.ideas.add({
    ...ideaData,
    userId,
    createdAt: Date.now(),
    syncStatus: "local",
  });
}

export async function getIdeas(
  userId,
  page = 1,
  limit = 10,
  searchTerm = "",
  filters = {}
) {
  // Ensure old createdAt values are normalized
  const allIdeas = await db.ideas.where("userId").equals(userId).toArray();

  for (const idea of allIdeas) {
    if (idea.createdAt && idea.createdAt.seconds) {
      // Firestore-style object → convert to ms
      await db.ideas.update(idea.id, {
        createdAt: idea.createdAt.seconds * 1000,
      });
    } else if (typeof idea.createdAt === "string") {
      // ISO string → convert to ms
      await db.ideas.update(idea.id, {
        createdAt: new Date(idea.createdAt).getTime(),
      });
    }
  }

  // Now query with compound index (safe, all numbers)
  let query = db.ideas
    .where("[userId+createdAt]")
    .between([userId, Dexie.minKey], [userId, Dexie.maxKey]);

  // Exclude deleted
  query = query.filter((idea) => idea.deleted !== true);

  // Search
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const searchableFields = [
      "title",
      "contentIdea",
      "context",
      "problem",
      "discovery",
      "teachingAngle",
      "hook",
    ];

    query = query.filter((idea) =>
      searchableFields.some(
        (field) =>
          idea[field] &&
          typeof idea[field] === "string" &&
          idea[field].toLowerCase().includes(searchLower)
      )
    );
  }

  // Filters
  if (Object.keys(filters).length) {
    query = query.filter((idea) => {
      for (const [key, value] of Object.entries(filters)) {
        if (idea[key] !== value) return false;
      }
      return true;
    });
  }

  // Paginate + reverse order
  const [total, ideas] = await Promise.all([
    query.count(),
    query
      .offset((page - 1) * limit)
      .limit(limit)
      .reverse()
      .toArray(),
  ]);

  return { ideas, total };
}

export async function getIdeaById(id) {
  const numericId = Number(id);

  // Simple cache for individual items
  const cacheKey = `idea_${numericId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const idea = await db.ideas.get(numericId);
  if (idea) {
    setCache(cacheKey, idea);
  }

  return idea;
}

export async function updateIdea(id, userId, updates) {
  // Clear related cache entries
  const cacheKey = `idea_${id}`;
  const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  cache.delete(cacheKey);
  cache.delete(pendingSyncKey);

  const finalUpdates = updates.syncStatus
    ? updates
    : { ...updates, syncStatus: "local" };

  // Use more efficient where clause with compound conditions
  return await db.ideas.where({ id: Number(id), userId }).modify(finalUpdates);
}

export async function deleteIdea(id, userId) {
  // Clear related cache entries
  const cacheKey = `idea_${id}`;
  const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  const countKey = getCacheKey(CACHE_KEYS.IDEAS_COUNT, userId);
  cache.delete(cacheKey);
  cache.delete(pendingSyncKey);
  cache.delete(countKey);

  // Soft delete: mark as deleted instead of removing
  return await db.ideas.where({ id: Number(id), userId }).modify({
    deleted: true,
    deletedAt: new Date().toISOString(),
    syncStatus: "local",
  });
}

export async function saveDraft(userId, draftData) {
  // Clear related cache entries
  const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  const countKey = getCacheKey(CACHE_KEYS.DRAFTS_COUNT, userId);
  cache.delete(pendingSyncKey);
  cache.delete(countKey);

  return await db.drafts.add({
    ...draftData,
    userId,
    createdAt: Date.now(), // ✅ use number
    syncStatus: "local",
  });
}

export async function getDrafts(userId, page = 1, limit = 10) {
  // Normalize old createdAt formats
  const allDrafts = await db.drafts.where("userId").equals(userId).toArray();

  for (const draft of allDrafts) {
    if (draft.createdAt && draft.createdAt.seconds) {
      // Firestore-style object → convert
      await db.drafts.update(draft.id, {
        createdAt: draft.createdAt.seconds * 1000,
      });
    } else if (typeof draft.createdAt === "string") {
      // ISO string → convert
      await db.drafts.update(draft.id, {
        createdAt: new Date(draft.createdAt).getTime(),
      });
    }
  }

  // Now safely use compound index
  let query = db.drafts
    .where("[userId+createdAt]")
    .between([userId, Dexie.minKey], [userId, Dexie.maxKey]);

  // Exclude deleted
  query = query.filter((draft) => draft.deleted !== true);

  const [total, drafts] = await Promise.all([
    query.count(),
    query
      .offset((page - 1) * limit)
      .limit(limit)
      .reverse() // newest first
      .toArray(),
  ]);

  return { drafts, total };
}

export async function updateDraft(id, userId, updates) {
  // Clear related cache entries
  const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  cache.delete(pendingSyncKey);

  const finalUpdates = updates.syncStatus
    ? updates
    : { ...updates, syncStatus: "local" };

  return await db.drafts.where({ id: Number(id), userId }).modify(finalUpdates);
}

export async function deleteDraft(id, userId) {
  // Clear related cache entries
  const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  const countKey = getCacheKey(CACHE_KEYS.DRAFTS_COUNT, userId);
  cache.delete(pendingSyncKey);
  cache.delete(countKey);

  // Soft delete: mark as deleted instead of removing
  return await db.drafts.where({ id: Number(id), userId }).modify({
    deleted: true,
    deletedAt: new Date().toISOString(),
    syncStatus: "local",
  });
}

export async function getPendingSync(userId) {
  // Check cache first for this expensive operation
  const cacheKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Use compound indexes for better performance
  const [pendingIdeas, pendingDrafts] = await Promise.all([
    db.ideas.where("[userId+syncStatus]").equals([userId, "local"]).toArray(),
    db.drafts.where("[userId+syncStatus]").equals([userId, "local"]).toArray(),
  ]);

  const result = { pendingIdeas, pendingDrafts };
  setCache(cacheKey, result);

  return result;
}

// Batch update function for better performance during sync operations
export async function batchUpdateSyncStatus(userId, updates) {
  return await db.transaction("rw", db.ideas, db.drafts, async () => {
    const promises = [];

    if (updates.ideas) {
      updates.ideas.forEach(({ id, cloudId, syncStatus }) => {
        promises.push(
          db.ideas.where({ id, userId }).modify({ cloudId, syncStatus })
        );
      });
    }

    if (updates.drafts) {
      updates.drafts.forEach(({ id, cloudId, syncStatus }) => {
        promises.push(
          db.drafts.where({ id, userId }).modify({ cloudId, syncStatus })
        );
      });
    }

    await Promise.all(promises);

    // Clear related cache
    const pendingSyncKey = getCacheKey(CACHE_KEYS.PENDING_SYNC, userId);
    cache.delete(pendingSyncKey);
  });
}

// FIXED: Comprehensive sync function to pull changes from cloud and apply to local DB
export async function syncFromCloud(userId, cloudData) {
  const { ideas: cloudIdeas = [], drafts: cloudDrafts = [] } = cloudData;

  console.log("Starting sync from cloud:", {
    cloudIdeasCount: cloudIdeas.length,
    cloudDraftsCount: cloudDrafts.length,
  });

  return await db.transaction("rw", db.ideas, db.drafts, async () => {
    // Get current local data
    const [localIdeas, localDrafts] = await Promise.all([
      db.ideas.where({ userId }).toArray(),
      db.drafts.where({ userId }).toArray(),
    ]);

    console.log("Local data before sync:", {
      localIdeasCount: localIdeas.length,
      localDraftsCount: localDrafts.length,
    });

    // CRITICAL FIX: If cloud is empty, clear all local data
    if (cloudIdeas.length === 0 && cloudDrafts.length === 0) {
      console.log("Cloud is empty, clearing all local data");
      await Promise.all([
        db.ideas.where({ userId }).delete(),
        db.drafts.where({ userId }).delete(),
      ]);
      clearUserCache(userId);
      return { cleared: true };
    }

    // Create maps for easier lookup
    const localIdeasMap = new Map(
      localIdeas
        .map((idea) => [idea.cloudId, idea])
        .filter(([cloudId]) => cloudId)
    );
    const localDraftsMap = new Map(
      localDrafts
        .map((draft) => [draft.cloudId, draft])
        .filter(([cloudId]) => cloudId)
    );
    const cloudIdeasMap = new Map(
      cloudIdeas.map((idea) => [idea.cloudId, idea])
    );
    const cloudDraftsMap = new Map(
      cloudDrafts.map((draft) => [draft.cloudId, draft])
    );

    const operations = [];

    // STEP 1: Process Ideas from Cloud
    for (const cloudIdea of cloudIdeas) {
      const localIdea = localIdeasMap.get(cloudIdea.cloudId);

      if (!localIdea) {
        // New idea from cloud - add it
        console.log("Adding new idea from cloud:", cloudIdea.cloudId);
        operations.push(
          db.ideas.add({
            ...cloudIdea,
            userId,
            syncStatus: "synced",
          })
        );
      } else {
        const cloudTime = new Date(cloudIdea.updatedAt || cloudIdea.createdAt);
        const localTime = new Date(localIdea.updatedAt || localIdea.createdAt);

        if (cloudTime > localTime) {
          // Cloud version is newer - update local
          console.log("Updating idea from cloud:", cloudIdea.cloudId);
          operations.push(
            db.ideas.where({ id: localIdea.id, userId }).modify({
              ...cloudIdea,
              id: localIdea.id, // Keep local ID
              userId, // Ensure userId is maintained
              syncStatus: "synced",
            })
          );
        }
      }
    }

    // STEP 2: Process Drafts from Cloud
    for (const cloudDraft of cloudDrafts) {
      const localDraft = localDraftsMap.get(cloudDraft.cloudId);

      if (!localDraft) {
        // New draft from cloud - add it
        console.log("Adding new draft from cloud:", cloudDraft.cloudId);
        operations.push(
          db.drafts.add({
            ...cloudDraft,
            userId,
            syncStatus: "synced",
          })
        );
      } else {
        const cloudTime = new Date(
          cloudDraft.updatedAt || cloudDraft.createdAt
        );
        const localTime = new Date(
          localDraft.updatedAt || localDraft.createdAt
        );

        if (cloudTime > localTime) {
          // Cloud version is newer - update local
          console.log("Updating draft from cloud:", cloudDraft.cloudId);
          operations.push(
            db.drafts.where({ id: localDraft.id, userId }).modify({
              ...cloudDraft,
              id: localDraft.id, // Keep local ID
              userId, // Ensure userId is maintained
              syncStatus: "synced",
            })
          );
        }
      }
    }

    // STEP 3: Handle deletions - FIXED LOGIC
    // Delete local items that don't exist in cloud anymore
    for (const localIdea of localIdeas) {
      // If item has cloudId but doesn't exist in cloud, it was deleted
      if (localIdea.cloudId && !cloudIdeasMap.has(localIdea.cloudId)) {
        console.log("Deleting idea (removed from cloud):", localIdea.cloudId);
        operations.push(db.ideas.where({ id: localIdea.id, userId }).delete());
      }
      // CRITICAL FIX: Also delete local-only items when cloud is not empty
      // This handles the case where user had local items but cloud was cleared
      else if (
        !localIdea.cloudId &&
        localIdea.syncStatus === "local" &&
        cloudIdeas.length === 0
      ) {
        console.log("Deleting local-only idea (cloud is empty):", localIdea.id);
        operations.push(db.ideas.where({ id: localIdea.id, userId }).delete());
      }
    }

    for (const localDraft of localDrafts) {
      // If item has cloudId but doesn't exist in cloud, it was deleted
      if (localDraft.cloudId && !cloudDraftsMap.has(localDraft.cloudId)) {
        console.log("Deleting draft (removed from cloud):", localDraft.cloudId);
        operations.push(
          db.drafts.where({ id: localDraft.id, userId }).delete()
        );
      }
      // CRITICAL FIX: Also delete local-only items when cloud is not empty
      else if (
        !localDraft.cloudId &&
        localDraft.syncStatus === "local" &&
        cloudDrafts.length === 0
      ) {
        console.log(
          "Deleting local-only draft (cloud is empty):",
          localDraft.id
        );
        operations.push(
          db.drafts.where({ id: localDraft.id, userId }).delete()
        );
      }
    }

    // Execute all operations
    await Promise.all(operations);

    // Clear all related caches after sync
    clearUserCache(userId);

    console.log("Sync completed successfully");
  });
}

// Helper function to clear all cache entries for a specific user
function clearUserCache(userId) {
  const keysToDelete = [];

  for (const key of cache.keys()) {
    if (key.includes(`_${userId}_`) || key.includes(`_${userId}`)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => cache.delete(key));
}

// Function to merge local changes with cloud data (for conflict resolution)
export async function mergeWithCloud(
  userId,
  cloudData,
  conflictResolution = "cloud-wins"
) {
  const { ideas: cloudIdeas = [], drafts: cloudDrafts = [] } = cloudData;

  return await db.transaction("rw", db.ideas, db.drafts, async () => {
    const [localIdeas, localDrafts] = await Promise.all([
      db.ideas.where({ userId }).toArray(),
      db.drafts.where({ userId }).toArray(),
    ]);

    const operations = [];
    const conflicts = [];

    // Create maps for easier lookup
    const localIdeasMap = new Map(
      localIdeas.map((idea) => [idea.cloudId, idea])
    );
    const localDraftsMap = new Map(
      localDrafts.map((draft) => [draft.cloudId, draft])
    );

    // Process Ideas with conflict detection
    for (const cloudIdea of cloudIdeas) {
      const localIdea = localIdeasMap.get(cloudIdea.cloudId);

      if (!localIdea) {
        // New from cloud
        operations.push(
          db.ideas.add({
            ...cloudIdea,
            userId,
            syncStatus: "synced",
          })
        );
      } else {
        const localTime = new Date(localIdea.updatedAt || localIdea.createdAt);
        const cloudTime = new Date(cloudIdea.updatedAt || cloudIdea.createdAt);

        if (
          localIdea.syncStatus === "local" &&
          Math.abs(cloudTime - localTime) < 1000
        ) {
          // Potential conflict - both modified around same time
          conflicts.push({
            type: "idea",
            cloudId: cloudIdea.cloudId,
            local: localIdea,
            cloud: cloudIdea,
          });

          if (conflictResolution === "cloud-wins") {
            operations.push(
              db.ideas.where({ id: localIdea.id, userId }).modify({
                ...cloudIdea,
                id: localIdea.id,
                userId,
                syncStatus: "synced",
              })
            );
          }
          // If 'local-wins', do nothing (keep local version)
        } else if (cloudTime > localTime) {
          // Cloud is newer, update local
          operations.push(
            db.ideas.where({ id: localIdea.id, userId }).modify({
              ...cloudIdea,
              id: localIdea.id,
              userId,
              syncStatus: "synced",
            })
          );
        }
      }
    }

    // Similar process for drafts
    for (const cloudDraft of cloudDrafts) {
      const localDraft = localDraftsMap.get(cloudDraft.cloudId);

      if (!localDraft) {
        operations.push(
          db.drafts.add({
            ...cloudDraft,
            userId,
            syncStatus: "synced",
          })
        );
      } else {
        const localTime = new Date(
          localDraft.updatedAt || localDraft.createdAt
        );
        const cloudTime = new Date(
          cloudDraft.updatedAt || cloudDraft.createdAt
        );

        if (
          localDraft.syncStatus === "local" &&
          Math.abs(cloudTime - localTime) < 1000
        ) {
          conflicts.push({
            type: "draft",
            cloudId: cloudDraft.cloudId,
            local: localDraft,
            cloud: cloudDraft,
          });

          if (conflictResolution === "cloud-wins") {
            operations.push(
              db.drafts.where({ id: localDraft.id, userId }).modify({
                ...cloudDraft,
                id: localDraft.id,
                userId,
                syncStatus: "synced",
              })
            );
          }
        } else if (cloudTime > localTime) {
          operations.push(
            db.drafts.where({ id: localDraft.id, userId }).modify({
              ...cloudDraft,
              id: localDraft.id,
              userId,
              syncStatus: "synced",
            })
          );
        }
      }
    }

    await Promise.all(operations);
    clearUserCache(userId);

    return { conflicts };
  });
}

// NEW: Complete sync replacement function for when cloud should be the single source of truth
export async function replaceLocalWithCloud(userId, cloudData) {
  const { ideas: cloudIdeas = [], drafts: cloudDrafts = [] } = cloudData;

  console.log("Replacing local data with cloud data");

  return await db.transaction("rw", db.ideas, db.drafts, async () => {
    // Delete ALL local data for this user
    await Promise.all([
      db.ideas.where({ userId }).delete(),
      db.drafts.where({ userId }).delete(),
    ]);

    const operations = [];

    // Add all cloud data as new local data
    for (const cloudIdea of cloudIdeas) {
      operations.push(
        db.ideas.add({
          ...cloudIdea,
          userId,
          syncStatus: "synced",
        })
      );
    }

    for (const cloudDraft of cloudDrafts) {
      operations.push(
        db.drafts.add({
          ...cloudDraft,
          userId,
          syncStatus: "synced",
        })
      );
    }

    await Promise.all(operations);
    clearUserCache(userId);

    console.log("Local data replaced with cloud data successfully");
  });
}

// Cleanup function to clear expired cache entries
export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Auto cleanup every 10 minutes
setInterval(clearExpiredCache, 10 * 60 * 1000);

// Debounced search function for better UX
export const debouncedSearch = debounce(
  async (userId, searchTerm, callback) => {
    try {
      const results = await getIdeas(userId, 1, 10, searchTerm);
      callback(results);
    } catch (error) {
      console.error("Search failed:", error);
      callback({ ideas: [], total: 0 });
    }
  },
  300
);

export default db;
