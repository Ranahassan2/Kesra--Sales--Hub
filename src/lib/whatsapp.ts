import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";

// We store the client and state globally so it persists during hot reloads in dev
declare global {
  var waClient: Client | undefined;
  var waState: {
    status: "DISCONNECTED" | "QR_READY" | "CONNECTED" | "INITIALIZING";
    qrCodeBase64: string | null;
  };
}

if (!global.waState) {
  global.waState = {
    status: "DISCONNECTED",
    qrCodeBase64: null,
  };
}

export const getWaState = () => global.waState;

export const initializeWhatsApp = () => {
  if (global.waClient) return;

  global.waState.status = "INITIALIZING";
  global.waState.qrCodeBase64 = null;

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    try {
      const base64Image = await qrcode.toDataURL(qr);
      global.waState.qrCodeBase64 = base64Image;
      global.waState.status = "QR_READY";
      console.log("WhatsApp QR Code is ready to be scanned.");
    } catch (e) {
      console.error("Failed to generate QR code", e);
    }
  });

  client.on("ready", () => {
    console.log("WhatsApp is connected and ready!");
    global.waState.status = "CONNECTED";
    global.waState.qrCodeBase64 = null;
  });

  client.on("disconnected", () => {
    console.log("WhatsApp disconnected");
    global.waState.status = "DISCONNECTED";
    global.waClient = undefined;
  });
  
  client.on("auth_failure", () => {
    console.log("WhatsApp auth failed");
    global.waState.status = "DISCONNECTED";
    global.waState.qrCodeBase64 = null;
  });

  client.initialize().catch((e) => {
    console.error("Failed to initialize WhatsApp client:", e);
    global.waState.status = "DISCONNECTED";
    global.waClient = undefined;
  });

  global.waClient = client;
};

export const getWaClient = () => global.waClient;

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  if (!global.waClient || global.waState.status !== "CONNECTED") {
    throw new Error("WhatsApp is not connected");
  }
  
  // Format phone number (append @c.us for regular numbers)
  // Usually numbers need to be purely digits and country code, e.g. 201012345678@c.us for Egypt
  const formattedPhone = phone.replace(/[^0-9]/g, ""); 
  const chatId = `${formattedPhone}@c.us`;
  
  await global.waClient.sendMessage(chatId, message);
};
