var wireless = require('wireless');
var fs = require('fs');
var _ = require('underscore');
var colors = require('colors');

var connectedToMyHome = false;

wireless.configure({
    iface: 'wlan0',
    updateFrequency: 12,
    vanishThreshold: 7,
});

console.log(("[PROGRESS] Enabling wireless card...").cyan);
wireless.enable(function() {
    console.log(("[PROGRESS] Wireless card enabled.").cyan);
    console.log(("[PROGRESS] Starting wireless scan...").cyan);

    wireless.start(function() {
        console.log(("[PROGRESS] Wireless scanning has commenced.").cyan);
    });
});

// Found a new network
wireless.on('appear', function(error, network) {
    if (error) {
        console.log("[   ERROR] There was an error when a network appeared");
        throw error;
    }

    var strength = Math.floor(network.quality / 70 * 100);

    var ssid = network.ssid || '<HIDDEN>';

    var encryption_type = 'NONE';
    if (network.encryption_wep) {
        encryption_type = 'WEP';
    } else if (network.encryption_wpa && network.encryption_wpa2) {
        encryption_type = 'WPA&WPA2';
    } else if (network.encryption_wpa) {
        encryption_type = 'WPA';
    } else if (network.encryption_wpa2) {
        encryption_type = 'WPA2';
    }

    console.log("[  APPEAR] " + ssid + " [" + network.address + "] " + strength + "% " + network.strength + " dBm " + encryption_type);

    if (!connectedToMyHome && network.ssid == 'nucleocide') {
        connectedToMyHome = true;
        wireless.join(network, null, function() {
            console.log("Yay, we connected!");
        },
        function() {
            console.log("Unable to connect.");
        });
    }
});

// A network disappeared (after the specified threshold)
wireless.on('vanish', function(error, network) {
    if (error) {
        console.log(("[   ERROR] There was an error when a network vanished").red);
        throw error;
    }
    console.log(("[  VANISH] " + network.ssid + " [" + network.address + "] ").green);
});

// A wireless network changed something about itself
wireless.on('change', function(error, network) {
    if (error) {
        console.log("[   ERROR] There was an error when a network changed");
        throw error;
    }
    console.log("[  CHANGE] " + network.ssid);
});

// We've joined a network
wireless.on('join', function(error, network) {
    console.log(("[    JOIN] " + network.ssid + " [" + network.address + "] ").green);
});

// We've left a network
wireless.on('leave', function(error, network) {
    console.log("[   LEAVE] " + network.ssid);
    console.log("Don't be sad. There are still " + wireless.networks.length + " fish in the sea.");
});

// Just for debugging purposes
wireless.on('debug', function(error, command) {
    console.log(("[ COMMAND] " + command).grey);
});

wireless.on('warning', function(error, message) {
    console.log(("[ WARNING] " + message).yellow);
});

wireless.on('error', function(error, message) {
    console.log(("[   ERROR] " + message).red);
});

wireless.on('fatal', function(error, message) {
    console.log(("[   FATAL] " + message).red.underline);
});

// User hit Ctrl + C
var killing_app = false;
process.on('SIGINT', function() {
    if (killing_app) {
        console.log(("[PROGRESS] Double SIGINT, Killing without cleanup!").cyan);
        process.exit();
    }
    killing_app = true;
    console.log(("[PROGRESS] Gracefully shutting down from SIGINT (Ctrl+C)").cyan);

    console.log(("[PROGRESS] Disabling Adapter...").cyan);
    wireless.disable(function() {

        console.log(("[PROGRESS] Stopping Wireless App...").cyan);
        wireless.stop(function() {

            console.log(("[PROGRESS] Exiting...").cyan);
            process.exit();
        });
    });
});
