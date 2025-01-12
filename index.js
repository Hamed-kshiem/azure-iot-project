const { EventHubConsumerClient } = require("@azure/event-hubs");
const WebSocket = require("ws");


const connectionString = process.env.CONNECTION_STRING;
const consumerGroup = "$Default"; // Default consumer group

// Initialize WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

let clients = [];

// Handle new WebSocket connections
wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    clients.push(ws);

    ws.on("close", () => {
        console.log("WebSocket connection closed");
        clients = clients.filter((client) => client !== ws);
    });
});

async function main() {
    console.log("Initializing Event Hub client...");
    console.log(connectionString)
    const client = new EventHubConsumerClient(consumerGroup, connectionString);

    console.log("Listening for messages...");
    client.subscribe({
        processEvents: async (events, context) => {
            for (const event of events) {
                const message = JSON.stringify(event.body);
                console.log(`Message received: ${message}`);

                // Broadcast message to all connected WebSocket clients
                clients.forEach((ws) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(message);
                    }
                });
            }
        },
        processError: async (err, context) => {
            console.error(`Error: ${err}`);
        }
    });
}

main().catch((err) => {
    console.error("Error running sample:", err);
});
