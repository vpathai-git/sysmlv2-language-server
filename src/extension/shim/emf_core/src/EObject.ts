// SPDX-License-Identifier: MIT
// Copyright (c) 2025-2026 VPATHAI

export interface EPackage {
    getName(): string;
    getNsURI(): string;
}

export interface EClass {
    getName(): string;
    getEPackage(): EPackage;
    getEStructuralFeature(name: string): EStructuralFeature | undefined;
    eAllStructuralFeatures?: EStructuralFeature[];
}

export interface EStructuralFeature {
    getName(): string;
    isMany(): boolean;
    isContainment?(): boolean;
}

export interface Resource {
    getURI(): URI;
    getContents(): EObject[];
    getAllContents(): IterableIterator<EObject>;
    getURIFragment(eObject: EObject): string;
    getEObject(uriFragment: string): EObject | undefined;
}

export interface URI {
    toString(): string;
    fragment(): string;
    trimFileExtension(): URI;
    lastSegment(): string;
    toFileString(): string;
    isFile(): boolean;
}

export interface EObject {
    eClass(): EClass;
    eContainer(): EObject | undefined;
    eResource(): Resource | undefined;
    eContents(): EObject[];
    eIsProxy(): boolean;
    
    eGet(feature: EStructuralFeature | string, resolve?: boolean): any;
    eSet(feature: EStructuralFeature | string, newValue: any): void;
    eIsSet(feature: EStructuralFeature | string): boolean;
    eUnset(feature: EStructuralFeature | string): void;
    
    // Internal methods for Shim management
    _setEContainer(container: EObject | undefined): void;
    _setEResource(resource: Resource | undefined): void;
    _setProxyURI(uri: any): void;
}

export class BasicEObject implements EObject {
    protected _eContainer: EObject | undefined;
    protected _eResource: Resource | undefined;
    protected _eProperties: Map<string, any> = new Map();
    protected _eClass: EClass;
    protected _proxyURI: any | undefined;
    
    constructor(eClass?: EClass) {
        this._eClass = eClass || {
            getName: () => "BasicEObject",
            getEPackage: () => ({ getName: () => "core", getNsURI: () => "http://core" }),
            getEStructuralFeature: (name) => ({ getName: () => name, isMany: () => false })
        };
    }

    eClass(): EClass {
        return this._eClass;
    }

    eIsProxy(): boolean {
        return this._proxyURI !== undefined;
    }

    _setProxyURI(uri: any): void {
        this._proxyURI = uri;
    }

    eContainer(): EObject | undefined {
        return this._eContainer;
    }

    eResource(): Resource | undefined {
        if (this._eResource) return this._eResource;
        if (this._eContainer) return this._eContainer.eResource();
        return undefined;
    }

    eContents(): EObject[] {
        const contents: EObject[] = [];
        // Iterate over all properties to find contained objects
        // Note: In a real EMF implementation, we would iterate EClass.getEAllContainments()
        // Here we scan the dynamic properties and check if they are EObjects
        
        for (const val of this._eProperties.values()) {
            if (Array.isArray(val)) {
                for (const item of val) {
                    if (this._isEObject(item) && item.eContainer() === this) {
                        contents.push(item);
                    }
                }
            } else if (this._isEObject(val) && val.eContainer() === this) {
                contents.push(val);
            }
        }
        return contents;
    }
    
    private _isEObject(obj: any): obj is EObject {
        return obj && typeof obj.eClass === 'function';
    }

    _setEContainer(container: EObject | undefined): void {
        this._eContainer = container;
    }

    _setEResource(resource: Resource | undefined): void {
        this._eResource = resource;
    }

    eGet(feature: EStructuralFeature | string, _resolve: boolean = true): any {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        
        // 1. Try direct property access (if it exists on the instance)
        if (featureName in this) {
            const val = (this as any)[featureName];
            return val === undefined ? null : val;
        }
        
        // 2. Try dynamic map
        const val = this._eProperties.get(featureName);
        return val === undefined ? null : val;
    }

    eSet(feature: EStructuralFeature | string, newValue: any): void {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        
        // 1. Try direct property access
        if (featureName in this) {
            (this as any)[featureName] = newValue;
            return;
        }
        
        // 2. Set in dynamic map
        this._eProperties.set(featureName, newValue);
    }

    eIsSet(feature: EStructuralFeature | string): boolean {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        
        if (featureName in this) {
            const val = (this as any)[featureName];
            return val !== undefined && val !== null;
        }
        
        return this._eProperties.has(featureName);
    }

    eUnset(feature: EStructuralFeature | string): void {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        
        if (featureName in this) {
            (this as any)[featureName] = undefined;
            return;
        }
        
        this._eProperties.delete(featureName);
    }
}
