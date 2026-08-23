/**
 * Safety Guards for Agent Commands
 * 
 * Prevents destructive operations and enforces command whitelisting.
 */

const ALLOWED_COMMANDS = [
  'npm test',
  'npm run build',
  'npm run lint',
  'git status',
  'git diff',
  'git log',
  'ls',
  'cat',
  'head',
  'tail',
  'grep',
  'find',
  'echo',
  'pwd',
  'node',
  'python3'
];

const BLOCKED_PATTERNS = [
  'rm -rf',
  'rm -r',
  'rm .*\\*',
  'DROP TABLE',
  'DELETE FROM.*WHERE.*1=1',
  'TRUNCATE',
  'sudo',
  'curl.*\\|.*bash',
  'wget.*\\|.*sh',
  'chmod 777',
  'mkfs',
  'dd if=/dev',
  '> /etc/',
  'shutdown',
  'reboot',
  'kill -9'
];

/**
 * Validate a command before execution
 * @param {string} cmd - The command to validate
 * @returns {boolean} - True if allowed
 * @throws {Error} - If command is blocked
 */
export function validateCommand(cmd) {
  if (!cmd || typeof cmd !== 'string') {
    throw new Error('Invalid command: must be a non-empty string');
  }
  
  const trimmedCmd = cmd.trim();
  const baseCmd = trimmedCmd.split(' ')[0];
  const baseCmdNormalized = baseCmd.toLowerCase();
  
  // Check against whitelist
  const isAllowed = ALLOWED_COMMANDS.some(allowed => {
    const normalized = allowed.toLowerCase();
    return trimmedCmd.toLowerCase().startsWith(normalized);
  });
  
  if (!isAllowed) {
    throw new Error(`Command not allowed: ${trimmedCmd}\nAllowed commands: ${ALLOWED_COMMANDS.join(', ')}`);
  }
  
  // Check against blocklist patterns
  for (const pattern of BLOCKED_PATTERNS) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(trimmedCmd)) {
        throw new Error(`Blocked pattern detected: ${trimmedCmd}\nPattern: ${pattern}`);
      }
    } catch (e) {
      if (e.message.includes('Blocked pattern')) {
        throw e;
      }
      // Ignore regex compilation errors, continue checking
    }
  }
  
  console.log(`✓ Command validated: ${trimmedCmd}`);
  return true;
}

/**
 * Sanitize file paths to prevent directory traversal
 * @param {string} path - The file path
 * @returns {string} - Sanitized path
 */
export function sanitizePath(path) {
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid path');
  }
  
  // Block directory traversal
  if (path.includes('..') || path.startsWith('/')) {
    throw new Error(`Directory traversal not allowed: ${path}`);
  }
  
  // Block access to sensitive directories
  const blockedPrefixes = ['/etc', '/proc', '/sys', '/root', '/var'];
  for (const prefix of blockedPrefixes) {
    if (path.startsWith(prefix)) {
      throw new Error(`Access to ${prefix} is not allowed`);
    }
  }
  
  return path;
}

export default { validateCommand, sanitizePath };
