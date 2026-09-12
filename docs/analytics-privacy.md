# Anonymous Gameplay Analytics

Analytics is optional and is enabled only when the public product configuration returns `analytics_enabled: true`. If Supabase is not configured, or the configuration endpoint is unavailable, tracking stays disabled and gameplay continues normally.

## Data Collected

Each event contains a random campaign ID, a random browser-session ID, an event name, a coarse device type (`mobile` or `desktop`), and a restricted properties object. The application does not send account data, e-mail, IP addresses, cookies, raw user-agent strings, names of visitors, passwords, or tokens.

The tracked event names are:

- `session_started`, `draft_started`, `draft_completed`, `worlds_started`, `campaign_finished`, `play_again`, `save_resumed`
- `roll_generated`, `exchange_used`, `player_selected`
- `series_started`, `game_completed`, `playoffs_reached`, `worlds_won`
- `how_to_play_opened`, `rating_details_opened`
- `share_started`, `share_completed`, `card_downloaded`

Roll, exchange, and selection events use normalized public historical player IDs, role, Worlds year, draft region group, exchange type, and candidate IDs. Completion events include integer draft or campaign duration. This supports aggregate draft completion, exchange use, pick/rejection frequency, outcome, year/group frequency, and mobile/desktop metrics without identifying a visitor.

Sharing events contain only the campaign outcome and a categorized method (`file`, `link`, or `download`). The generated image, shared text, destination application, recipients, clipboard contents, and contacts are never collected. The browser's share sheet is controlled by the player and the operating system.

## Feedback

At the end of a campaign, a player may choose `Bom`, `Ok`, or `Ruim` and optionally send a note up to 500 characters. The UI asks players not to include personal data. Feedback is stored separately from analytics events, is readable only by explicit administrators, and permits one entry per anonymous campaign ID.

## Storage and Failure Behavior

Up to 50 unsent events are held in browser-local storage and retried on later interactions. The queue is never shown to the player, analytics errors are ignored, and neither tracking nor feedback changes a game result, campaign save, timer, or navigation.

The development-only `VITE_ADMIN_DEMO_MODE=true` setting uses an in-memory transport. It allows visual testing of the feedback form but sends and retains no analytics or feedback.

## Administrative Reporting

Only users in `admin_users` can call `get_admin_dashboard_metrics()`. The RPC returns aggregate counts, sharing intent/completion/download totals, rates, top-ten ranked public player IDs, device totals, and up to ten recent optional feedback notes. It does not return raw analytics-event rows to the browser.
