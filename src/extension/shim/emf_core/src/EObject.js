"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicEObject = void 0;
class BasicEObject {
    constructor(eClass) {
        this._eProperties = new Map();
        this._eClass = eClass || {
            getName: () => "BasicEObject",
            getEPackage: () => ({ getName: () => "core", getNsURI: () => "http://core" }),
            getEStructuralFeature: (name) => ({ getName: () => name, isMany: () => false })
        };
    }
    eClass() {
        return this._eClass;
    }
    eIsProxy() {
        return this._proxyURI !== undefined;
    }
    _setProxyURI(uri) {
        this._proxyURI = uri;
    }
    eContainer() {
        return this._eContainer;
    }
    eResource() {
        if (this._eResource)
            return this._eResource;
        if (this._eContainer)
            return this._eContainer.eResource();
        return undefined;
    }
    eContents() {
        const contents = [];
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
            }
            else if (this._isEObject(val) && val.eContainer() === this) {
                contents.push(val);
            }
        }
        return contents;
    }
    _isEObject(obj) {
        return obj && typeof obj.eClass === 'function';
    }
    _setEContainer(container) {
        this._eContainer = container;
    }
    _setEResource(resource) {
        this._eResource = resource;
    }
    eGet(feature, resolve = true) {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        // 1. Try direct property access (if it exists on the instance)
        if (featureName in this) {
            const val = this[featureName];
            return val === undefined ? null : val;
        }
        // 2. Try dynamic map
        const val = this._eProperties.get(featureName);
        return val === undefined ? null : val;
    }
    eSet(feature, newValue) {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        // 1. Try direct property access
        if (featureName in this) {
            this[featureName] = newValue;
            return;
        }
        // 2. Set in dynamic map
        this._eProperties.set(featureName, newValue);
    }
    eIsSet(feature) {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        if (featureName in this) {
            const val = this[featureName];
            return val !== undefined && val !== null;
        }
        return this._eProperties.has(featureName);
    }
    eUnset(feature) {
        const featureName = typeof feature === 'string' ? feature : feature.getName();
        if (featureName in this) {
            this[featureName] = undefined;
            return;
        }
        this._eProperties.delete(featureName);
    }
}
exports.BasicEObject = BasicEObject;
