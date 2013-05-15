/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

const { Cc, Ci, Cu, ChromeWorker } = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const file = require("sdk/io/file");
const { env } = require('sdk/system/environment');

var RDPLoggingEnabled = false;
var collected = {
    messages: []
};

var RDPLoggingBaseDir = env.RDPLOGDIR;

if (! RDPLoggingBaseDir) {
    RDPLoggingBaseDir = Services.dirsvc.get("CurWorkD", Ci.nsILocalFile).path;
}

const injectRDPLoggingIfEnabled = function(client, transport) {
  if (RDPLoggingEnabled == false) {
      return;
  }

  let originalSend = transport.send.bind(transport);

  transport.send = function(aPacket) {
    console.debug("RDP[send]: ", JSON.stringify(aPacket, null, 2));
    collected.messages.push({
        direction: "send",
        packet: aPacket
    });
    originalSend(aPacket);
  };

  let originalOnPacket = transport.hooks.onPacket.bind(client);

  transport.hooks.onPacket = function(aPacket) {
    console.debug("RDP[receive]: ", JSON.stringify(aPacket, null, 2));
    collected.messages.push({
        direction: "receive",
        packet: aPacket
    });
    originalOnPacket(aPacket);
  };
};

const enableRDPLogging = function(value) {
  RDPLoggingEnabled = value;
};

const flushRDPLogging = function(baseFileName) {
    let messages = collected.messages;
    collected.messages = [];

    try {
        let jsonOut = file.open(file.join(RDPLoggingBaseDir, baseFileName) + ".json", "w");
        let umlOut = file.open(file.join(RDPLoggingBaseDir, baseFileName) + ".plantuml", "w");

        jsonOut.write(JSON.stringify(messages, null, 2), jsonOut.close.bind(jsonOut));
        umlOut.write(convertToPlantUML(baseFileName, messages), umlOut.close.bind(jsonOut));
    } catch(e) {
        console.error(e);
    }
};

const convertToPlantUML = function(baseFileName, messages) {
    var lines = [
        "@startuml " + baseFileName + ".png",
        "actor dbgserver",
        "actor dbgclient"
    ];

    messages.forEach(function (message) {
        var line = "";
        switch (message.direction) {
        case "send":
            line += "dbgclient -> dbgserver:";
            break;
        case "receive":
            line += "dbgserver -> dbgclient:";
            break;
        default:
            throw "Unknown RDP Message direction: " + message.direction;
        }

        line += JSON.stringify(message.packet, summary, 2).replace(/[\n]/g, '\\n');
        lines.push(line);
    });

    lines.push("@enduml");
    return lines.join("\n");
};

function summary(key, value) {
    switch (typeof value) {
    case "string":
        if (value.length > 100) {
            value = "VERY LONG STRING...";
        }
        break;
    case "object":
    case "function":
    }

    return value;
}

module.exports = {
  enableRDPLogging: enableRDPLogging,
  injectRDPLoggingIfEnabled: injectRDPLoggingIfEnabled,
  flushRDPLogging: flushRDPLogging
};
