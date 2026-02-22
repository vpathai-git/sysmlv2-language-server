package TestQualified {
    package Inner {
        port def PortType;
        item def ItemType;
    }

    part def TestPart {
        // Test 1: Simple port with qualified type
        port p1 : Inner::PortType;

        // Test 2: Item with qualified type
        attribute a1 : Inner::ItemType;
    }
}
