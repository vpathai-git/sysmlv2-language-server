import { AbstractValidator, EObject } from '@sysml/shim';

/**
 * The main SysML Validator that extends the Shim's AbstractValidator.
 * This class contains SysML v2 validation logic.
 * 
 * Currently, it serves as a placeholder/stub to verify the integration pipeline.
 */
export class SysMLShimValidator extends AbstractValidator {
    
    /**
     * Example check to verify the validator is running.
     * In the future, this will be replaced by @Check methods.
     */
    public checkExample(e: EObject) {
        // Simple check: If an element has a name 'Error', report an error.
        // This assumes the element has a 'name' property or similar.
        // We use 'any' access because EObject in Shim is generic.
        const name = (e as any)['name'];
        if (name === 'Error') {
            this.error("Element name cannot be 'Error'", e, 'name');
        }
    }
}
