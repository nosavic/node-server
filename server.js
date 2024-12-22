// Import required modules
const http = require("http");
const fs = require("fs");
const path = require("path");

// Utility functions for API server
const readData = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      return [];
    }
  } catch (err) {
    throw new Error("Error reading data");
  }
};

const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    throw new Error("Error writing data");
  }
};

const inventoryPath = path.join(__dirname, "items.json");

// Web Server
const webServer = http.createServer((req, res) => {
  const url = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(__dirname, "public", url);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 - Page Not Found</h1>");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    }
  });
});

// API Server
const apiServer = http.createServer((req, res) => {
  const { method, url } = req;
  const basePath = "/api/items";

  if (url.startsWith(basePath)) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        let items = readData(inventoryPath);

        if (method === "GET" && url === basePath) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, data: items }));
        } else if (method === "POST" && url === basePath) {
          const newItem = JSON.parse(body);
          newItem.id = Date.now();
          items.push(newItem);
          writeData(inventoryPath, items);
          res.writeHead(201, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, data: newItem }));
        } else if (method === "GET" && url.startsWith(`${basePath}/`)) {
          const id = parseInt(url.split("/").pop());
          const item = items.find((i) => i.id === id);
          if (item) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: item }));
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ success: false, message: "Item not found" })
            );
          }
        } else if (method === "PUT" && url.startsWith(`${basePath}/`)) {
          const id = parseInt(url.split("/").pop());
          const itemIndex = items.findIndex((i) => i.id === id);
          if (itemIndex !== -1) {
            const updatedItem = { ...items[itemIndex], ...JSON.parse(body) };
            items[itemIndex] = updatedItem;
            writeData(inventoryPath, items);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: updatedItem }));
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ success: false, message: "Item not found" })
            );
          }
        } else if (method === "DELETE" && url.startsWith(`${basePath}/`)) {
          const id = parseInt(url.split("/").pop());
          const filteredItems = items.filter((i) => i.id !== id);
          if (filteredItems.length !== items.length) {
            writeData(inventoryPath, filteredItems);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, message: "Item deleted" }));
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ success: false, message: "Item not found" })
            );
          }
        } else {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, message: "Method not allowed" })
          );
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, message: "Server error" }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, message: "Route not found" }));
  }
});

// Start servers
webServer.listen(3000, () => {
  console.log("Web server running on http://localhost:3000");
});

apiServer.listen(4000, () => {
  console.log("API server running on http://localhost:4000");
});
