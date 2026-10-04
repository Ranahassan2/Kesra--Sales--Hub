import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This webhook is designed to receive data from an AI Notetaker (like Fireflies.ai or Fathom)
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Example payload structure from AI tools:
    // {
    //   "meeting_id": "12345",
    //   "attendees": ["customer@example.com", "sales@ourcompany.com"],
    //   "recording_url": "https://...",
    //   "transcript": "Customer: Hello\nSales: Hi...",
    //   "summary": "The customer is interested in the premium plan.",
    //   "lead_id": "cmus64kh60000w961psgnxyo9" // Ideally passed in custom data
    // }

    // Since we generate the Jitsi link in the CRM like: "jitsi_${lead.id}"
    // The AI might pass the meeting title containing the Lead ID, or we can look it up by email.
    // For this example, let's assume the payload includes the leadId directly.
    
    const leadId = payload.lead_id;
    
    if (!leadId) {
      return NextResponse.json({ error: "Missing lead_id in payload" }, { status: 400 });
    }

    // Find the latest meeting for this lead
    const latestMeeting = await prisma.meeting.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestMeeting) {
      return NextResponse.json({ error: "No meeting found for this lead" }, { status: 404 });
    }

    // Update the meeting with AI data
    await prisma.meeting.update({
      where: { id: latestMeeting.id },
      data: {
        recordingUrl: payload.recording_url,
        transcript: payload.transcript,
        aiAnalysis: payload.summary,
        status: "DONE" // Automatically mark as done when AI sends the report
      }
    });

    // Add a system activity for the manager to see
    await prisma.activity.create({
      data: {
        leadId,
        userId: latestMeeting.ownerId,
        type: "AI_MEETING_ANALYSIS",
        message: "تم حفظ تسجيل وتحليل الميتنج بواسطة الذكاء الاصطناعي 🤖"
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
