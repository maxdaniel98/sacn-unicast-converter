const { Receiver, Sender } = require("sacn");
require("dotenv").config();

const config = {
  hostListenAddr: process.env.HOST_LISTEN_ADDR,
  hostSendAddr: process.env.HOST_SEND_ADDR,
  destinationAddr: process.env.DESTINATION_ADDR.split(",").map((addr) =>
    addr.trim()
  ),
  universe: parseInt(process.env.UNIVERSE),
};

const sACN = new Receiver({
  universes: [config.universe],
  reuseAddr: true,
  iface: config.hostListenAddr,
  // see table 1 below for all options
});

let lastPacketTime = null;
let packetTimer = null;

console.log(
  `Listening for DMX data on universe ${config.universe} (${config.hostListenAddr})...`
);

const receivedPacketLog = (packet) => {
  if (lastPacketTime === null || Date.now() - lastPacketTime > 5000) {
    console.log(
      `Receiving DMX data on universe ${packet.universe} from ${packet.sourceName} (${packet.sourceAddr})`
    );
    console.log(
      `Sending DMX data to ${config.destinationAddr.join(", ")} from ${
        config.hostSendAddr
      }`
    );
  }
  lastPacketTime = Date.now();

  clearTimeout(packetTimer);
  packetTimer = setTimeout(() => {
    console.log("Stopped receiving DMX data.");
  }, 5000);
};

const sACNServers = [];
for (let i = 0; i < config.destinationAddr.length; i++) {
  sACNServers.push(
    new Sender({
      universe: [config.universe],
      reuseAddr: true,
      iface: config.hostSendAddr,
      useUnicastDestination: config.destinationAddr[i],
      // see table 3 below for all options
    })
  );
}
sACN.on("packet", (packet) => {
  receivedPacketLog(packet);
  for (let i = 0; i < sACNServers.length; i++) {
    sACNServers[i].send({
      sourceName: "My NodeJS app", // optional. LED lights will use this as the name of the source lighting console.
      priority: 100,
      payload: packet.payload,
    });
  }
});

sACN.on("PacketCorruption", (err) => {
  // trigged if a corrupted packet is received
});

sACN.on("PacketOutOfOrder", (err) => {
  // trigged if a packet is received out of order
});

/* advanced usage below */

sACN.on("error", (err) => {
  console.error(err);
  // trigged if there is an internal error (e.g. the supplied `iface` does not exist)
});
