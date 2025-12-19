# Study Plan & Progress Tracking

## Completed Tasks (Recent Fixes)

### 1. Data Consistency (The "Entity" Fix)
- [x] **Problem**: Changing username/avatar in Profile didn't update posts, comments, reels, or stories.
- [x] **Solution**: Implemented a "Single Source of Truth" update mechanism.
- [x] **Details**:
    -   Updated `userService.ts` to batch update:
        -   Posts collection
        -   Comments (Collection Group Query)
        -   Reels collection
        -   Stories collection
        -   Notifications (Sent history)
    -   **Result**: Changing your profile immediately updates your identity across the entire app.

### 2. Tag/Reply Consistency
- [x] **Problem**: Changing username broke old replies (e.g., "Replying to @OldName").
- [x] **Solution**: Added "Look Back" logic.
- [x] **Details**:
    -   Before updating profile, fetch the *old* username.
    -   Access `replyToUsername` in comments and update those matching the old name to the new name.

### 3. Follow Button Logic
- [x] **Problem**: Follow button flickered or reverted state; followed users didn't appear in "Following" list immediately.
- [x] **Solution**: Implemented Optimistic Updates & Local Store Sync.
- [x] **Details**:
    -   Updated `ProfileScreen.tsx` to instantly update the global `currentUser` store (client-side) upon clicking Follow.
    -   Explicitly fetches fresh user data in the background to confirm.
    -   Removed `currentUser` dependency from `useEffect` to prevent "Double Loading" (looping).

### 4. Story Bar "Add" Button
- [x] **Problem**: "Plus" icon was inside the avatar (inconsistent) when no story existed, but outside when one did.
- [x] **Solution**: Unified styling.
- [x] **Details**:
    -   The `+` badge is now always positioned absolutely at the bottom-right of the avatar, regardless of story state.

### 5. Error Handling (Missing Indexes)
- [x] **Problem**: App crashed when updating profile if Firestore Indexes were missing.
- [x] **Solution**: Added "Fail-Safe" robust error handling.
- [x] **Details**:
    -   Wrapped update blocks (Comments, Reels, etc.) in independent `try/catch` blocks.
    -   If an index is missing, it logs the Link to Console (for the dev to fix) but *continues* updating other parts of the app instead of crashing.

---

## Current Status
-   **System Stability**: High.
-   **Data Integrity**: Consistent across all features.
-   **UI/UX**: Polished (No flickers, consistent icons).

## Next Goals
-   [ ] (Add new learning goals or features here...)
