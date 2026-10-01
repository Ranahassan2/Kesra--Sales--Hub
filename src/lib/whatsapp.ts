import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode";
import fs from "fs/promises";
import path from "path";

type WaStatus = "DISCONNECTED" | "QR_READY" | "CONNECTED" | "INITIALIZING";

interface UserWaState {
  status: WaStatus;
  qrCodeBase64: string | null;
  client?: Client;
}

declare global {
  var waSessions: Map<string, UserWaState> | undefined;
}

if (!global.waSessions) {
  global.waSessions = new Map<string, UserWaState>();
}

export const getWaState = (userId: string) => {
  if (!global.waSessions!.has(userId)) {
    global.waSessions!.set(userId, { status: "DISCONNECTED", qrCodeBase64: null });
  }
  const state = global.waSessions!.get(userId)!;
  return { status: state.status, qrCodeBase64: state.qrCodeBase64 };
};

export const initializeWhatsApp = (userId: string) => {
  if (!global.waSessions!.has(userId)) {
    global.waSessions!.set(userId, { status: "DISCONNECTED", qrCodeBase64: null });
  }
  const state = global.waSessions!.get(userId)!;

  if (state.client) return;

  state.status = "INITIALIZING";
  state.qrCodeBase64 = null;

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: userId }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    try {
      const base64Image = await qrcode.toDataURL(qr);
      state.qrCodeBase64 = base64Image;
      state.status = "QR_READY";
      console.log(`WhatsApp QR Code is ready for user ${userId}.`);
    } catch (e) {
      console.error(`Failed to generate QR code for user ${userId}`, e);
    }
  });

  client.on("ready", () => {
    console.log(`WhatsApp is connected and ready for user ${userId}!`);
    state.status = "CONNECTED";
    state.qrCodeBase64 = null;
  });

  client.on("disconnected", () => {
    console.log(`WhatsApp disconnected for user ${userId}`);
    state.status = "DISCONNECTED";
    state.client = undefined;
  });
  
  client.on("auth_failure", () => {
    console.log(`WhatsApp auth failed for user ${userId}`);
    state.status = "DISCONNECTED";
    state.qrCodeBase64 = null;
  });

  client.initialize().catch((e) => {
    console.error(`Failed to initialize WhatsApp client for user ${userId}:`, e);
    state.status = "DISCONNECTED";
    state.client = undefined;
  });

  state.client = client;
};

export const getWaClient = (userId: string) => {
  return global.waSessions?.get(userId)?.client;
};

export const sendWhatsAppMessage = async (userId: string, phone: string, message: string) => {
  const client = getWaClient(userId);
  const state = getWaState(userId);
  if (!client || state.status !== "CONNECTED") {
    throw new Error("WhatsApp is not connected");
  }
  
  const formattedPhone = phone.replace(/[^0-9]/g, ""); 
  const chatId = `${formattedPhone}@c.us`;
  
  await client.sendMessage(chatId, message);
};

export const logoutWhatsApp = async (userId: string) => {
  const state = global.waSessions?.get(userId);
  if (state?.client) {
    try {
      await state.client.logout();
      await state.client.destroy();
    } catch (e) {
      console.error(`Error destroying client for user ${userId}`, e);
    }
  }
  
  global.waSessions?.set(userId, { status: "DISCONNECTED", qrCodeBase64: null });
  
  // Clean up the auth folder so they get a fresh QR next time
  try {
    const sessionPath = path.join(process.cwd(), ".wwebjs_auth", `session-${userId}`);
    await fs.rm(sessionPath, { recursive: true, force: true });
  } catch (e) {
    console.error(`Could not remove session folder for user ${userId}`, e);
  }
};
