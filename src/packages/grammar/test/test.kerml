// KerML test file
// NOTE: 'type' declarations require specialization clause (e.g., :> Base)
// Using 'struct' which doesn't require specialization
package P {
    abstract struct F {
        abstract feature f;
        feature v : F;  // 'var' is SysML keyword, not KerML
    }
}
