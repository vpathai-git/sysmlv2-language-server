/**
 * SysML Validation Adapter
 *
 * Adapts the Shim AbstractValidator to Langium's validation mechanism.
 *
 * Rationale: Bridge layer that correctly adapts between Shim and Langium validation
 * systems. This is a necessary Langium integration layer.
 * Follows Langium patterns documented at https://langium.org/docs/reference/validation/
 */

import { AbstractValidator, Severity, EObject } from '@sysml/shim';
import { ValidationAcceptor, AstNode } from 'langium';

/**
 * Adapts the Shim AbstractValidator to Langium's validation mechanism.
 * This allows the ported SysML validation logic (which runs on EObjects)
 * to report diagnostics in the Langium-based Language Server.
 */
export class SysMLValidatorAdapter {
    private shimValidator: AbstractValidator;

    constructor(shimValidator: AbstractValidator) {
        this.shimValidator = shimValidator;
    }

    /**
     * Validates a Langium AST node using the Shim Validator.
     * @param node The AST node to validate (cast to EObject)
     * @param accept The Langium acceptor to report diagnostics to
     */
    public validate(node: AstNode, accept: ValidationAcceptor): void {
        // Twin Philosophy: The AST is structurally identical to the EObject model.
        // We cast it to EObject so the Shim can operate on it.
        const eObject = node as unknown as EObject;
        
        // Run the Shim validation logic
        // Note: The Shim validator iterates all check methods. 
        // Ideally, we would only run checks relevant to this node type,
        // but the Shim's simple implementation runs everything.
        // The ported checks are expected to guard against incorrect types.
        const issues = this.shimValidator.validate(eObject);
        
        // Convert Shim issues to Langium diagnostics
        for (const issue of issues) {
            const severity = this.convertSeverity(issue.severity);
            
            // If the issue source is different from the node, we might want to report it there.
            // But for now, we assume the issue is related to the validated node or its children.
            // If source is different, we'd need to map it back to an AstNode.
            // Since we are passing the node as the source, it should match.
            
            accept(severity, issue.message, {
                node: node,
                property: issue.feature as any
            });
        }
    }

    private convertSeverity(severity: Severity): 'error' | 'warning' | 'info' | 'hint' {
        switch (severity) {
            case Severity.ERROR: return 'error';
            case Severity.WARNING: return 'warning';
            case Severity.INFO: return 'info';
            default: return 'info';
        }
    }
}
