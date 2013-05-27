rdp-logging Addon-SDK package
=============================

Status: **PROOF OF CONCEPT**

This package contains a small utility module which helps to
inject "Mozilla Remote Debugger Protocol" messages logging into a
debugger client transport and to save logged messages into a JSON file
and generate a UML Sequence diagram using PlantUML syntax
(as in http://github.com/rpl/MozillaRDP-wireshark-plugins but without
tshark and node dependencies).

It can be useful to generate UML Sequence diagrams from test units.

## How to use inject logging into a debugger client transport

```
const { injectRDPLoggingIfEnabled } = require("rdp-logging");

...
    let transport = debuggerSocketConnect("127.0.0.1", this.remoteDebuggerPort);

    let client = new DebuggerClient(transport);

    // NOTE: hooks transport.send and transport.hooks.onPacket (if enabled)
    injectRDPLoggingIfEnabled(client, transport);
```

injectRDPLogging will inject RDP messages logging only if it will be configured
to enable logging before it will be called, by default it does nothing.

## How to enable logging and generate diagrams from addons-sdk test units

```
let { enableRDPLogging, flushRDPLogging } = require("rdp-logging");

### enable logging (injectRDPLogging will hook send and receiving methods)
enableRDPLogging(true);

....

### flush logged messages in a json file and a plantuml file using
### its first parameter as base filename and RDPLOGDIR environment variable
### as base dir
flushRDPLogging("test-remote-simulator-client");
```

## EXAMPLE: diagram generation integrated into FirefoxOS Simulator tests

As an example of integration of rdp-logging into an addon-sdk based project,
I've pushed an experimental branch into my r2d2b2g github fork:

* https://github.com/rpl/r2d2b2g/compare/test;rdp-logging

Using this branch we can generate Mozilla RDP logs into **addon/test/RDPLOGS** dir
using **make test** and optionally generate *png* diagrams using **make plantuml**.
