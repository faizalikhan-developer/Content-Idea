You are senior frontend engineer, having expertise in `reactjs`, `indexDB` and `firebase`.

Your task is to understand the following issue, analyse the provided file, find the root cause and fix it.

You don't have to edit or code an entire file, you are providing only assistance so pinpoint the issue, provide what needed to be changed, where and with what.

## Issue

- User `sync` the local indexDB database with cloud (firebase) -> got two drafts -> edited one of the draft.
- Ideally user should not be able to sync with the cloud because they haven't pushed the edited draft, but right now they are able to sync with the cloud instead of getting warning that local data haven't pushed.
- There is no change in the cloud database and the local change the user made in the draft is also not affected
