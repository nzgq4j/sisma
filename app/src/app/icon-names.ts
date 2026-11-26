// The Material Symbols the app uses (app/icon-names.test.ts keeps this list complete; update it with
// UPDATE_ICONS=1 npx vitest run icon-names). Google Fonts then serves only these glyphs.
export const ICON_NAMES: readonly string[] = [
  'add', 'add_location', 'add_location_alt', 'admin_panel_settings', 'android', 'arrow_back', 'arrow_forward',
  'arrow_upward', 'article', 'badge', 'bar_chart', 'battery_full', 'bedtime', 'block', 'bookmark_added', 'build',
  'call_split', 'campaign', 'cancel', 'check', 'check_circle', 'chevron_right', 'circles', 'close', 'code',
  'content_copy', 'contrast', 'credit_card', 'cycle', 'dashboard', 'database', 'delete', 'details', 'devices',
  'distance', 'done', 'donut_large', 'download', 'earthquake', 'email', 'error', 'event', 'event_repeat',
  'expand_less', 'expand_more', 'feed', 'filter', 'filter_alt', 'fit_screen', 'format_list_bulleted', 'globe',
  'graphic_eq', 'group', 'health_and_safety', 'help', 'history', 'home', 'hourglass_top', 'info', 'ios', 'ios_share',
  'key', 'landscape', 'language', 'layers', 'light', 'lightbulb', 'list', 'lists', 'location_on', 'lock', 'lock_reset',
  'login', 'logout', 'mail', 'map', 'margin', 'mark_email_read', 'menu_book', 'monitoring', 'mouse', 'my_location',
  'near_me', 'note', 'notifications', 'notifications_active', 'notifications_off', 'open_in_new', 'pan_tool',
  'password', 'pause', 'person', 'phone', 'pill', 'place', 'play_arrow', 'post', 'preliminary', 'priority_high',
  'privacy', 'progress_activity', 'public', 'query_stats', 'radar', 'radio', 'refresh', 'remove', 'report', 'resize',
  'restore', 'rocket_launch', 'schedule', 'science', 'search', 'security', 'send', 'sensors', 'settings', 'share',
  'shop', 'signal_cellular_alt', 'sort', 'source', 'south', 'south_america', 'speed', 'splitscreen_left',
  'stacked_line_chart', 'start', 'step', 'store', 'straighten', 'support_agent', 'switch', 'tab', 'table_restaurant',
  'table_rows', 'target', 'terrain', 'texture', 'timeline', 'title', 'token', 'touch_app', 'transform', 'translate',
  'travel_explore', 'tsunami', 'tune', 'upgrade', 'verified', 'verified_user', 'vertical_align_bottom', 'vibration',
  'visibility', 'visibility_off', 'volcano', 'warning', 'watch', 'waves', 'waving_hand', 'web', 'wifi', 'window',
  'workspace_premium', 'zoom_in_map',
];

/**
 * Stylesheet for the icon font: Rounded, optical size 24, weight 400–600 (icons inherit bold labels), outline and
 * filled (.ms.fill), and only these icons: about 41 KiB instead of the full font's ~3 MB.
 */
export function iconFontHref() {
  return `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL@24,400..600,0..1&icon_names=${[...ICON_NAMES].sort().join(',')}&display=block`;
}
