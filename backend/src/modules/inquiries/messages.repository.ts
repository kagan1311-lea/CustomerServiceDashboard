import type { Record as AirtableRecord, FieldSet } from "airtable";
import { messagesTable } from "../../db/airtable";
import { MessageSenderType, SENDER_TYPE_FROM_AIRTABLE, SENDER_TYPE_TO_AIRTABLE } from "../../types/inquiry";

export interface InquiryMessage {
  id: string;
  inquiryId: string;
  senderType: MessageSenderType;
  senderId: string | null;
  content: string;
  isInternalNote: boolean;
  createdAt: string;
}

function mapRecord(record: AirtableRecord<FieldSet>): InquiryMessage {
  const senderType = record.get("Sender Type") as string | undefined;
  const inquiry = record.get("Inquiry") as string[] | undefined;
  const sender = record.get("Sender") as string[] | undefined;

  return {
    id: record.id,
    inquiryId: inquiry?.[0] ?? "",
    senderType: (senderType ? SENDER_TYPE_FROM_AIRTABLE[senderType] : undefined) ?? "SYSTEM",
    senderId: sender?.[0] ?? null,
    content: (record.get("Content") as string) ?? "",
    isInternalNote: Boolean(record.get("Is Internal Note")),
    createdAt: (record.get("Created At") as string) ?? "",
  };
}

// Airtable formulas can't filter a linked-record field by record ID (only by
// the linked record's primary-field text), so we fetch all messages and
// filter in JS. Fine at SMB scale; revisit if message volume grows a lot.
export async function listAllMessages(): Promise<InquiryMessage[]> {
  const records = await messagesTable.select().all();
  return records.map(mapRecord);
}

export async function listMessagesForInquiry(inquiryId: string): Promise<InquiryMessage[]> {
  const messages = await listAllMessages();
  return messages
    .filter((m) => m.inquiryId === inquiryId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export interface CreateMessageInput {
  inquiryId: string;
  senderType: MessageSenderType;
  senderId?: string;
  content: string;
  isInternalNote: boolean;
}

export async function createMessage(input: CreateMessageInput): Promise<InquiryMessage> {
  const [record] = await messagesTable.create([
    {
      fields: {
        Content: input.content,
        Inquiry: [input.inquiryId],
        "Sender Type": SENDER_TYPE_TO_AIRTABLE[input.senderType],
        ...(input.senderId ? { Sender: [input.senderId] } : {}),
        "Is Internal Note": input.isInternalNote,
        "Created At": new Date().toISOString(),
      },
    },
  ]);
  return mapRecord(record);
}
