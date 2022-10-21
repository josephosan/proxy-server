const net = require('net');
const debug = require('debug')('app:debug');

let server = net.createServer();


server.on("connection", (clientToProxySocket) => {
  console.log("client connected to proxy");
  clientToProxySocket.once("data", data => {
    let isThereAConnection = data.toString().indexOf("CONNECT") !== -1;

    let serverPort = 80;
    let serverAddress;

    // if the connection is https
    if(isThereAConnection) {
      serverPort = 443;

      // get the information of the request by spliting the data.
      try {
        serverAddress = data
          .toString()
          .split("CONNECT")[1]
          .split(" ")[1]
          .split(":")[0];
      } catch(err) {
        console.error(err);
      }

      console.log("https connection: " + serverAddress);
    } else {
      try {
        serverAddress = data.toString().split("Host: ")[1].split("\n")[0];
      } catch(err) {
        console.error(err);
      }
      console.log("http connection: " + serverAddress);
    }

    let proxyToServerSocket = net.createConnection({
      host: serverAddress, 
      port: serverPort
    },
    () => {
      console.log('Proxy to server setup');
    });

    if(isThereAConnection) {
      clientToProxySocket.write("HTTP/1.1 200 OK\r\n\n");
    } else {
      proxyToServerSocket.write(data);
    }

    clientToProxySocket.pipe(proxyToServerSocket);
    proxyToServerSocket.pipe(clientToProxySocket);

    proxyToServerSocket.on("error", err => {
      console.log("proxy to server error");
      console.log(err);
    });

    clientToProxySocket.on("error", err => {
      console.log('client to proxy error');
      console.log(err);
    });
  });
});

server.on("error", error => {
  console.error(error);
});

server.on("close", () => {
  console.log('client closed the connection.');
});


const PORT = process.env.PORT;
server.listen({
  host:"127.0.0.1",
  port: PORT
}, () => {
  debug('Connected to port ' + PORT);
});