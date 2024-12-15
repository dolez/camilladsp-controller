// src/services/avahi-monitor.js
const dbus = require("dbus-native");

class AvahiMonitor {
  constructor(io) {
    this.io = io;
    this.services = new Map();
    this.bus = dbus.systemBus();
    this.avahiServer = null;
  }

  start() {
    this.bus
      .getService("org.freedesktop.Avahi")
      .getInterface("/", "org.freedesktop.Avahi.Server", (err, server) => {
        if (err) {
          console.error("Erreur connexion Avahi:", err);
          return;
        }

        this.avahiServer = server;
        this.setupBrowser();
      });
  }

  setupBrowser() {
    this.avahiServer.ServiceBrowserNew(
      -1,
      -1,
      "_camilladsp._tcp",
      "local",
      0,
      (err, browserPath) => {
        if (err) {
          console.error("Erreur browser service:", err);
          return;
        }

        this.bus
          .getService("org.freedesktop.Avahi")
          .getInterface(
            browserPath,
            "org.freedesktop.Avahi.ServiceBrowser",
            (err, browser) => {
              if (err) {
                console.error("Erreur interface browser:", err);
                return;
              }
              this.handleServiceUpdates(browser);
            }
          );
      }
    );
  }

  handleServiceUpdates(browser) {
    browser.on("ItemNew", (iface, protocol, name, type, domain, flags) => {
      this.resolveService(iface, protocol, name, type, domain);
    });

    browser.on("ItemRemove", (iface, protocol, name, type, domain, flags) => {
      this.services.delete(name);
      this.broadcastUpdate();
    });
  }

  resolveService(iface, protocol, name, type, domain) {
    this.avahiServer.ResolveService(
      iface,
      protocol,
      name,
      type,
      domain,
      -1,
      0,
      (
        err,
        iface,
        protocol,
        name,
        type,
        domain,
        host,
        aprotocol,
        address,
        port,
        txt,
        flags
      ) => {
        if (err) {
          console.error("Erreur résolution service:", err);
          return;
        }

        this.services.set(name, {
          name,
          host,
          address,
          port,
          txt: this.parseTxt(txt),
        });

        this.broadcastUpdate();
      }
    );
  }

  parseTxt(txt) {
    return txt.reduce((acc, item) => {
      const [key, value] = item.toString().split("=");
      acc[key] = value;
      return acc;
    }, {});
  }

  broadcastUpdate() {
    this.io.emit("avahi-services", Array.from(this.services.values()));
  }
}

module.exports = AvahiMonitor;
