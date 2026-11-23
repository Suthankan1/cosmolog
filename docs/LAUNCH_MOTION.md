# Launch motion

The static native splash and first React frame share the 128 dp ivory C and forest background (#102F26). Start motion after layout, mark display and native splash dismissal.

| Time | Composition |
| --- | --- |
| 0–360 ms | Fade out the centred mark. Bring the Apollo 17 globe up 6 dp as it fades in. |
| 160–650 ms | Fade in the ivory masthead and ease it up 4 dp, 16 dp below Earth. |
| 650–820 ms | Hold the composition in the safe area. |
| 820–1000 ms | Fade through to the laid-out destination. If local startup takes longer, hold the globe and masthead with a restoration status until ready. |

Skip and Reduce Motion bypass the timeline. The overlay shields the covered route from touches and accessibility. App resume preserves the current screen. All artwork is bundled. A globe load failure leaves the masthead available.
