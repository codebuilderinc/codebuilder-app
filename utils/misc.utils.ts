/**
 * Miscellaneous utility functions
 */

/**
 * Converts a timestamp to a human-readable "time ago" string
 * @param timestamp - Date object, ISO string, or timestamp in milliseconds
 * @returns Human-readable string like "<1 min ago", "5 mins ago", "1 hour ago", etc.
 */
export const timeAgo = (timestamp: Date | string | number): string => {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return '<1 min ago';
  } else if (diffMins === 1) {
    return '1 min ago';
  } else if (diffMins < 60) {
    return `${diffMins} mins ago`;
  } else if (diffHours === 1) {
    return '1 hour ago';
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffWeeks === 1) {
    return '1 week ago';
  } else if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  } else if (diffMonths === 1) {
    return '1 month ago';
  } else if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  } else if (diffYears === 1) {
    return '1 year ago';
  } else {
    return `${diffYears} years ago`;
  }
};

/**
 * Creates a Date object from a time string (HH:MM:SS.mmm) and optional reference date
 * Useful for converting LogViewer timestamps back to Date objects
 * @param timeString - Time in format "HH:MM:SS.mmm"
 * @param referenceDate - Optional reference date (defaults to today)
 * @returns Date object
 */
export const parseTimeString = (timeString: string, referenceDate?: Date): Date => {
  const ref = referenceDate || new Date();
  const [timePart, msPart] = timeString.split('.');
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  
  const date = new Date(ref);
  date.setHours(hours, minutes, seconds, parseInt(msPart || '0', 10));
  
  return date;
};
