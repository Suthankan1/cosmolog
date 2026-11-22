# COSMOLOG v2 — Component catalogue

[Figma components](https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N?node-id=11-4)

| Component | Variants/role | Notes |
|---|---|---|
| ObservationMark | forest/ivory | Editable SVG main components; same mark in launcher, intro and lockup |
| FeatherIcon | home, bookmark, user, search, bell, arrows, cloud, check, etc. | Figma SVG components, source-code Feather icon library |
| PrimaryButton | normal, pressed, loading, disabled planned | Forest, 52 dp, ivory copy |
| OutlineButton | normal, pressed, disabled planned | Ivory base, terracotta border |
| LabelledInput | default, focused, error, disabled planned | Visible label, 48 dp field; handle keyboard |
| FilterChip | neutral/selected | Use only if actual filter functionality implemented |
| OfflineBanner | cached/offline, refreshing planned | Explicit status and local data availability |
| BottomNavigation | Discover / Favourites / Profile active | Three unique tabs |
| FeaturedArticleCard | loaded/loading/error | Full photo, dark text contrast overlay, provenance |
| CompactArticleRow | saved/default, multi-line title | 70px thumbnail and readable metadata |
| SourceAttribution | NASA / Spaceflight News | Actual source URLs/credits in production |
| SaveAction | saved/unsaved/animating | Reanimated bonus with reduced motion |
| ErrorPanel | network fail/retry | Preserve cached content |
| EmptyState | no first cache/empty Favourites/no results | Explain next useful action |
| ProfileStat | actual storage/bookmark count | Not hardcoded demo values |

Figma v2 currently has the base reusable components; extended visual states are specified for implementation and can be added as proper variants. Do not claim every planned state is already a Figma variant.
