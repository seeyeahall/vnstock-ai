import { statSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

/**
 * Build Freshness Checker
 * Kiểm tra xem dist/ đã được build từ source mới nhất chưa
 */

const APP_DIR = join(process.cwd(), '..');
const DIST_DIR = join(APP_DIR, 'dist');
const SRC_DIR = join(APP_DIR, 'src');

function getNewestMtime(dir, extensions = null) {
  let newest = 0;
  
  function scan(currentDir) {
    try {
      const entries = readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules, .git, dist, etc.
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'local-backend') {
            continue;
          }
          scan(fullPath);
        } else if (entry.isFile()) {
          if (extensions && !extensions.includes(extname(entry.name))) {
            continue;
          }
          try {
            const mtime = statSync(fullPath).mtimeMs;
            if (mtime > newest) {
              newest = mtime;
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  
  scan(dir);
  return newest;
}

function checkBuildFreshness() {
  // Check if dist exists
  if (!existsSync(DIST_DIR)) {
    return {
      fresh: false,
      dist_exists: false,
      message: 'dist/ folder not found — frontend chưa được build. Chạy "npm run build" trước.',
      action: 'build'
    };
  }
  
  // Check if dist/index.html exists
  const distIndex = join(DIST_DIR, 'index.html');
  if (!existsSync(distIndex)) {
    return {
      fresh: false,
      dist_exists: true,
      index_exists: false,
      message: 'dist/index.html not found — build có thể bị lỗi.',
      action: 'rebuild'
    };
  }
  
  // Get dist newest file time
  const distNewest = getNewestMtime(DIST_DIR);
  
  // Get src newest file time (only .tsx, .ts, .css, .html)
  const srcNewest = getNewestMtime(SRC_DIR, ['.tsx', '.ts', '.css', '.html', '.js', '.jsx']);
  
  // Also check index.html at root
  const rootIndex = join(APP_DIR, 'index.html');
  let rootIndexMtime = 0;
  if (existsSync(rootIndex)) {
    rootIndexMtime = statSync(rootIndex).mtimeMs;
  }
  
  const overallSrcNewest = Math.max(srcNewest, rootIndexMtime);
  
  const fresh = distNewest >= overallSrcNewest;
  const diffMs = overallSrcNewest - distNewest;
  const diffMinutes = Math.round(diffMs / 60000);
  
  if (fresh) {
    return {
      fresh: true,
      dist_exists: true,
      index_exists: true,
      dist_newest: new Date(distNewest).toISOString(),
      src_newest: new Date(overallSrcNewest).toISOString(),
      message: '✅ Frontend đã build mới nhất.',
      action: null
    };
  } else {
    return {
      fresh: false,
      dist_exists: true,
      index_exists: true,
      dist_newest: new Date(distNewest).toISOString(),
      src_newest: new Date(overallSrcNewest).toISOString(),
      diff_minutes: diffMinutes,
      message: `⚠️ Source đã thay đổi ${diffMinutes} phút trước khi build gần nhất. Cần chạy "npm run build" để cập nhật.`,
      action: 'rebuild'
    };
  }
}

export { checkBuildFreshness };
