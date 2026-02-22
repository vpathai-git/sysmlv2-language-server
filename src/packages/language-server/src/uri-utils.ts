/**
 * URI Utilities for GitHub VFS
 *
 * VS Code sends URIs in multiple formats for the same file:
 * - vscode-vfs://github/owner/repo/path/file.sysml
 * - github://github/owner/repo/path/file.sysml
 * - github+file://owner/repo/path/file.sysml
 *
 * This module normalizes them to a canonical form to prevent duplicate documents.
 */

import { URI } from 'langium';

/**
 * Canonical scheme for GitHub VFS URIs
 */
const CANONICAL_GITHUB_SCHEME = 'github';

/**
 * Normalize a GitHub VFS URI to a canonical form.
 *
 * Examples:
 *   vscode-vfs://github/owner/repo/path.sysml → github://owner/repo/path.sysml
 *   github://github/owner/repo/path.sysml → github://owner/repo/path.sysml
 *   github+file://owner/repo/path.sysml → github://owner/repo/path.sysml
 *
 * Non-GitHub URIs are returned unchanged.
 */
export function normalizeGitHubUri(uri: string | URI): string {
    const uriString = typeof uri === 'string' ? uri : uri.toString();

    // Parse the URI
    let parsed: URL;
    try {
        parsed = new URL(uriString);
    } catch {
        // If it can't be parsed as URL, return as-is
        return uriString;
    }

    // Check if this is a GitHub VFS URI
    const scheme = parsed.protocol.replace(':', '');

    // For vscode-vfs, must have hostname 'github'
    if (scheme === 'vscode-vfs') {
        if (parsed.hostname !== 'github') {
            return uriString;  // Not a GitHub VFS URI
        }
    } else if (scheme !== 'github' && !scheme.startsWith('github+')) {
        return uriString;  // Not a GitHub VFS URI
    }

    // Extract the path components
    // vscode-vfs://github/owner/repo/path → authority="github", pathname="/owner/repo/path"
    // github://github/owner/repo/path → authority="github", pathname="/owner/repo/path"
    // github://owner/repo/path → authority="owner", pathname="/repo/path"

    let normalizedPath: string;

    if (parsed.protocol === 'vscode-vfs:' && parsed.hostname === 'github') {
        // vscode-vfs://github/owner/repo/path → /owner/repo/path
        normalizedPath = parsed.pathname;
    } else if (parsed.protocol === 'github:' && parsed.hostname === 'github') {
        // github://github/owner/repo/path → /owner/repo/path (remove redundant "github")
        normalizedPath = parsed.pathname;
    } else if (parsed.protocol === 'github:') {
        // github://owner/repo/path → /owner/repo/path
        normalizedPath = '/' + parsed.hostname + parsed.pathname;
    } else {
        // Other github+ schemes
        normalizedPath = '/' + parsed.hostname + parsed.pathname;
    }

    // Construct canonical URI: github://owner/repo/path
    // Remove leading slash for authority
    const pathWithoutLeadingSlash = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
    const parts = pathWithoutLeadingSlash.split('/');

    if (parts.length >= 2) {
        const owner = parts[0];
        const rest = parts.slice(1).join('/');
        return `${CANONICAL_GITHUB_SCHEME}://${owner}/${rest}`;
    }

    // Fallback: return with canonical scheme
    return `${CANONICAL_GITHUB_SCHEME}://${pathWithoutLeadingSlash}`;
}

/**
 * Check if a URI is a GitHub VFS URI
 */
export function isGitHubVfsUri(uri: string | URI): boolean {
    const uriString = typeof uri === 'string' ? uri : uri.toString();

    try {
        const parsed = new URL(uriString);
        const scheme = parsed.protocol.replace(':', '');

        // For vscode-vfs scheme, we need to check the hostname is 'github'
        // vscode-vfs://github/... is GitHub, but vscode-vfs://gitlab/... is not
        if (scheme === 'vscode-vfs') {
            return parsed.hostname === 'github';
        }

        // For github, github+file, github+https schemes, they're always GitHub
        return scheme === 'github' || scheme.startsWith('github+');
    } catch {
        return false;
    }
}

/**
 * Get a normalized key for document storage.
 * For GitHub VFS URIs, returns the normalized form.
 * For other URIs, returns the original string.
 */
export function getDocumentKey(uri: string | URI): string {
    const uriString = typeof uri === 'string' ? uri : uri.toString();

    if (isGitHubVfsUri(uriString)) {
        return normalizeGitHubUri(uriString);
    }

    return uriString;
}

/**
 * Check if two URIs refer to the same document (after normalization)
 */
export function isSameDocument(uri1: string | URI, uri2: string | URI): boolean {
    return getDocumentKey(uri1) === getDocumentKey(uri2);
}
