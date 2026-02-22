// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

import { URI } from './EObject.js';

export class URIImpl implements URI {
    private _uri: string;

    constructor(uri: string) {
        this._uri = uri;
    }

    toString(): string {
        return this._uri;
    }

    fragment(): string {
        const idx = this._uri.indexOf('#');
        return idx >= 0 ? this._uri.substring(idx + 1) : '';
    }

    trimFileExtension(): URI {
        const lastDot = this._uri.lastIndexOf('.');
        if (lastDot > 0) {
            return new URIImpl(this._uri.substring(0, lastDot));
        }
        return this;
    }

    lastSegment(): string {
        const parts = this._uri.split('/');
        return parts[parts.length - 1];
    }

    toFileString(): string {
        if (this._uri.startsWith('file://')) {
            return this._uri.substring(7);
        }
        return this._uri;
    }
    
    isFile(): boolean {
        return this._uri.startsWith('file:');
    }
    
    static createURI(uri: string): URI {
        return new URIImpl(uri);
    }
}
