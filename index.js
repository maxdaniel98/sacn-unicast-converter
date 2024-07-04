const { Receiver, Sender } = require("sacn");

const config = {
  hostListenAddr: "100.105.73.151",
  hostSendAddr: "10.43.1.111",
  destinationAddr: ["10.43.1.201", "10.43.1.202", "10.43.1.203"],
  universe: 1,
  fromChannel: 1,
  channelCount: 512,
  channelOffset: 0,
};

const sACN = new Receiver({
  universes: [config.universe],
  reuseAddr: true,
  iface: config.hostListenAddr,
  // see table 1 below for all options
});

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
