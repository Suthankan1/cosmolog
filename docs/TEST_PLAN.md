# Test plan

## Required minimum
At least three meaningful tests; target five or more.

1. Auth validation: blank username/password and malformed input.
2. Favourite repository: add/remove and persistence after reopening DB.
3. Offline repository: cached feed and favourites read without network.
4. Normalization: valid/invalid NASA and Spaceflight News payloads.
5. Sync: upsert is idempotent; no duplicate rows; favourite relation survives refresh.

## Integration/device scenarios
- Login success and invalid login.
- Registration simulation returns to login and explains DummyJSON behaviour.
- Detail route loads by `source + itemId`.
- Save from Details and Home; restart app.
- Airplane mode after first successful sync.
- Cold start in airplane mode.
- Open favourite detail offline including saved image.
- Return online and confirm refresh.
- API error while cached data remains visible.
- Empty API response differs from request failure.
- Logout clears SecureStore token and authenticated state.
- Font scaling, screen reader labels, touch targets and reduced motion.
