# Multi-Repo Local Caching System

## Overview

The app now supports seamless multi-repo data caching, eliminating the need to refresh when switching between repos. Data for multiple repos is cached locally and restored instantly when you switch.

## Key Changes

### 1. **PR Store (`prStore.ts`)**

#### New State
- `repoPRCache: Map<string, Map<string, PullRequest>>` - Stores PR data for each repo

#### Cache Persistence
- **Load on startup**: `loadPRCache()` restores cached PR data from electron-store
- **Save on updates**: `savePRCache()` debounced (5s) to persist changes to disk
- All PR updates (individual and bulk) automatically update the cache

#### Repo Switching
- `setSelectedRepo()` now instantly restores cached PRs from `repoPRCache`
- No API call needed if data was previously fetched

### 2. **Issue Store (`issueStore.ts`)**

#### New State  
- `repoIssueCache: Map<string, Map<string, Issue>>` - Stores issue data for each repo

#### Cache Updates
- `fetchIssues()` adds fetched issues to `repoIssueCache`
- `updateIssue()` updates both the active map and the cache

### 3. **Sync Store (`syncStore.ts`)**

#### Parallel Syncing
- All recently viewed repos now sync **in parallel** instead of sequentially
- Much faster initial sync with multiple repos
- Progress message shows `"Syncing X/Y repos..."`

#### Smart Syncing
- Syncs all repos in `recentlyViewedRepos` + the selected repo
- Stores are updated from cache, not from API responses (optimistic updates)

## Benefits

✅ **Instant Switching** - Switch between repos without reload/refetch  
✅ **Persistent Cache** - Data survives app restarts  
✅ **Parallel Syncing** - Multiple repos fetch simultaneously  
✅ **Fast** - Cached data is instantly available  
✅ **Smart** - Only fetches when needed, respects user actions  

## How It Works

### Switching Repos (Cached)
```
User clicks repo → setSelectedRepo() → Restore from repoPRCache → Display instantly
```

### Syncing Multiple Repos
```
Sync triggered → Fetch all repos in parallel → Update cache → Done
```

### Data Persistence
```
PR/Issue update → Update in-memory store → Debounce 5s → Save to disk
```

## Cache Size

The cache stores data for:
- **Currently selected repo** - Always cached
- **Recently viewed repos** - All stored (previously limited to 3, now all)
- **All fetched repos** - Never cleared unless app uninstalled

Each repo cache stores the full PR/Issue objects, so with 5 repos × 100 PRs = 500 cached items in memory.

## Technical Details

### Storage Backend
- Uses `electron-store` (persistent JSON on disk)
- Keys: `"prCache"` and (future) `"issueCache"`  
- Auto-saves with 5-second debounce to avoid disk thrashing

### Memory Efficiency
- Maps maintain references to the same PR/Issue objects
- No duplication between `pullRequests` and `repoPRCache`
- Old repos remain cached until user manually clears them

### Optimistic Updates (AGENTS.md Pattern)
The caching system follows the established optimistic update pattern:
1. Set loading flag on object
2. Call API in background
3. Update from local cache (not API response)
4. On error: revert only loading flag

See `issueStore.ts` methods like `linkPRsToIssue` for reference implementation.

## Future Improvements

- Manual cache clear button in Settings
- Per-repo cache size limits
- LRU eviction policy for old repos
- Compress cached data before saving
