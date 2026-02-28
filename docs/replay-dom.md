# Replay DOM Reconstruction

This SDK does event-based replay, not video.

## Captured events
- `dom_snapshot`
- `dom_mutation`
- `dom_input`
- `dom_scroll`
- `dom_viewport`
- `ui_click`
- `nav`
- `network`
- `network_error`

## Privacy controls
- script and inline handlers removed from snapshot path
- sensitive input values masked
- sensitive headers removed
