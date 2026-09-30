import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get("userId");
    const withGroupId = searchParams.get("groupId");

    if (withGroupId) {
      // Mark incoming messages as read (you can implement Group Message Read Receipts later)
      // Fetch messages for the group
      const messages = await prisma.chatMessage.findMany({
        where: { groupId: withGroupId },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      });
      return NextResponse.json({ messages: messages.reverse() });
    }

    if (withUserId) {
      // Mark incoming messages as read
      await prisma.chatMessage.updateMany({
        where: {
          senderId: withUserId,
          receiverId: currentUserId,
          isRead: false
        },
        data: { isRead: true }
      });

      // Fetch messages between current user and the selected user
      const messages = await prisma.chatMessage.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: withUserId },
            { senderId: withUserId, receiverId: currentUserId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      });
      return NextResponse.json({ messages: messages.reverse() });
    }

    // Fetch conversation list: all users except self
    const users = await prisma.user.findMany({
      where: { id: { not: currentUserId } },
      select: {
        id: true,
        name: true,
        role: true,
        lastActiveAt: true,
      },
    });

    const groups = await prisma.chatGroup.findMany({
      where: { members: { some: { userId: currentUserId } } },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
    });

    // Optionally get latest message for each to sort/display
    const userConversations = await Promise.all(users.map(async (u) => {
      const latestMsg = await prisma.chatMessage.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: u.id },
            { senderId: u.id, receiverId: currentUserId },
          ]
        },
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true, senderId: true, isRead: true }
      });
      return {
        user: u,
        isGroup: false,
        latestMessage: latestMsg
      };
    }));

    const groupConversations = await Promise.all(groups.map(async (g) => {
      const latestMsg = await prisma.chatMessage.findFirst({
        where: { groupId: g.id },
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true, senderId: true, isRead: true }
      });
      return {
        group: g,
        isGroup: true,
        latestMessage: latestMsg
      };
    }));

    const conversations = [...userConversations, ...groupConversations];

    // Sort by latest message time, then active time
    conversations.sort((a, b) => {
      const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0;
      const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, receiverId, groupId, file } = body;

    if ((!receiverId && !groupId) || (!content && !file)) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let finalContent = content || "";

    // Handle file upload
    if (file && file.base64 && file.name) {
      try {
        const base64Data = file.base64.includes(',') ? file.base64.split(',')[1] : file.base64;
        const buffer = Buffer.from(base64Data, 'base64');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Sanitize filename and make it unique
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const uniqueName = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadDir, uniqueName);
        
        await fs.writeFile(filePath, buffer);
        finalContent = `[FILE:/uploads/${uniqueName}]${file.name}`;
      } catch (err) {
        console.error("File upload error:", err);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: finalContent.trim(),
        senderId: session.user.id,
        receiverId: receiverId || null,
        groupId: groupId || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      }
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Chat POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existingMessage = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!existingMessage || existingMessage.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: content.trim() }
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    console.error("Chat PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  return PUT(req); // Fallback for unrefreshed clients
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
    }

    const existingMessage = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!existingMessage || existingMessage.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
