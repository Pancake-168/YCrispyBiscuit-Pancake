/**
 * Reply operations (no stickers, no E2EE handling, no threads).
 *
 * This file provides small helpers to:
 * - add m.in_reply_to relation to outgoing content
 * - detect whether a sent event should show a reply preview
 * - resolve the parent event for a reply (find from room cache, otherwise load via context API)
 * - build a minimal preview model for UI rendering
 *
 * NOTE: As requested, this implementation avoids stickers/encryption/threads logic.
 */

import type {
	IContent,
	MatrixClient,
	MatrixEvent,
	Room,
} from "matrix-js-sdk/src/matrix";

/**
 * Extract the parent (replied-to) eventId from an event.
 * - Returns undefined if event has no m.in_reply_to or has been redacted.
 */
export function getParentEventId(ev?: MatrixEvent): string | undefined {
	if (!ev || ev.isRedacted()) return undefined;
	const relates = (ev.getWireContent()?.["m.relates_to"]) as any;
	const inReplyTo = relates?.["m.in_reply_to"]; // { event_id: string }
	return typeof inReplyTo?.event_id === "string" ? inReplyTo.event_id : undefined;
}

/**
 * Whether the given event should show a reply preview (UI decides where to render it).
 * Simplified rules (threads & extra filters intentionally omitted):
 * - not redacted
 * - has m.relates_to.m.in_reply_to.event_id
 */
export function shouldDisplayReply(ev: MatrixEvent): boolean {
	if (!ev) return false;
	if (ev.isRedacted()) return false;
	return !!getParentEventId(ev);
}

/**
 * Mutate content to include m.in_reply_to relation (for sending a reply).
 * You should call this before sending an m.room.message.
 */
export function addReplyRelationToContent(content: IContent, replyToEventId: string): IContent {
	const relates = (content["m.relates_to"] as Record<string, any>) ?? {};
	content["m.relates_to"] = {
		...relates,
		"m.in_reply_to": { event_id: replyToEventId },
	} as any;
	return content;
}

/**
 * Find an event in room by ID.
 */
function findEvent(room: Room, eventId: string): MatrixEvent | null {
	return room.findEventById(eventId) ?? null;
}

/**
 * Resolve the parent (replied-to) event for a given event.
 * Strategy: room.findEventById() → client.getEventTimeline() to load → find again.
 */
export async function resolveParentEvent(
	client: MatrixClient,
	roomId: string,
	parentEventId: string,
): Promise<MatrixEvent | null> {
	const room = client.getRoom(roomId);
	if (!room) return null;

	const cached = findEvent(room, parentEventId);
	if (cached) return cached;

	try {
		// Ask the HS for a timeline that contains the target event.
		await client.getEventTimeline(room.getUnfilteredTimelineSet(), parentEventId);
	} catch {
		return null; // not resolvable
	}
	return findEvent(room, parentEventId);
}

/**
 * Build a compact textual summary for a reply preview.
 * This intentionally keeps types minimal and does not special-case stickers/encryption.
 */
export function summarizeEventForReply(ev: MatrixEvent): string {
	const content = ev.getContent?.() ?? {} as any;
	const msgtype: string | undefined = content.msgtype;

	// Helper: strip Markdown/HTML to plain text
	const toPlain = (text?: string): string => stripMarkdownToPlain(stripHtmlTags(text || ""));

	if (msgtype === "m.text") {
		const raw = typeof content.body === "string" ? content.body : "";
		const formatted = typeof content.formatted_body === "string" ? content.formatted_body : "";
		const source = formatted || raw;
		const plain = toPlain(source).replace(/\s+/g, " ").trim();
		return plain || "[文本]";
	}

	// Non-text: show a short type badge + optional filename/alt
	const filename: string | undefined = typeof content.body === "string" ? content.body : undefined;
	const label = msgtypeToLabel(msgtype);
	if (msgtype === "m.image") {
		const alt = content.info?.alt || undefined;
		return alt ? `${label} ${alt}` : (filename ? `${label} ${filename}` : label);
	}
	if (msgtype === "m.audio" || msgtype === "m.video" || msgtype === "m.file") {
		return filename ? `${label} ${filename}` : label;
	}

	// Fallback
	return "[消息]";
}

/**
 * Convert Matrix msgtype to a short human label.
 */
function msgtypeToLabel(msgtype?: string): string {
	switch (msgtype) {
		case "m.image": return "[图片]";
		case "m.audio": return "[音频]";
		case "m.video": return "[视频]";
		case "m.file": return "[文件]";
		default: return "[文本]";
	}
}

/**
 * Remove HTML tags to plain text (very small sanitizer for previews)
 */
function stripHtmlTags(html: string): string {
	return html.replace(/<[^>]*>/g, "");
}

/**
 * Naive Markdown → plain text stripper for preview summaries.
 * Keeps readable text; removes formatting markers/links syntax.
 */
function stripMarkdownToPlain(md: string): string {
	let s = md;
	// code blocks
	s = s.replace(/```[\s\S]*?```/g, " ");
	// inline code
	s = s.replace(/`([^`]+)`/g, "$1");
	// images ![alt](url) → alt 或 图片
		s = s.replace(/!\[([^\]]*)\]\([^\)]*\)/g, (_m, alt) => (alt ? alt : "图片"));
	// links [text](url) → text
	s = s.replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1");
	// emphasis/bold/strike
	s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
	s = s.replace(/\*([^*]+)\*/g, "$1");
	s = s.replace(/__([^_]+)__/g, "$1");
	s = s.replace(/_([^_]+)_/g, "$1");
	s = s.replace(/~~([^~]+)~~/g, "$1");
	// headings/list markers/quotes/tables
	s = s.replace(/^\s{0,3}#{1,6}\s+/gm, "");
	s = s.replace(/^\s*[-*+]\s+/gm, "");
	s = s.replace(/^\s*\d+\.\s+/gm, "");
	s = s.replace(/^\s*>\s?/gm, "");
	s = s.replace(/\|/g, " ");
	// think tags
	s = s.replace(/<\/?think>/g, "");
	// collapse whitespace
	s = s.replace(/[\t\r\n]+/g, " ");
	return s.trim();
}

export interface ReplyPreviewModel {
	parentEventId: string;
	roomId: string;
	senderId: string | undefined;
	senderName: string | null | undefined;
	ts: number | undefined; // timestamp (ms)
	summary: string; // compact single-line summary
	// Optionally, UI can choose to inspect the parent event directly if needed.
	parentEvent?: MatrixEvent | null;
	msgtype?: string;
}

/**
 * From a child event that is a reply, build a minimal preview model by resolving its parent.
 * Returns null if no parent or parent cannot be resolved.
 */
export async function buildReplyPreviewFromChild(
	client: MatrixClient,
	childEvent: MatrixEvent,
): Promise<ReplyPreviewModel | null> {
	const parentId = getParentEventId(childEvent);
	if (!parentId) return null;
	const roomId = childEvent.getRoomId();
	if (!roomId) return null;

	const parent = await resolveParentEvent(client, roomId, parentId);
	if (!parent) return null;

	const room = client.getRoom(roomId) ?? undefined;
	const senderId = parent.getSender();
	const senderName = senderId ? room?.getMember(senderId)?.name ?? senderId : undefined;

	return {
		parentEventId: parentId,
		roomId,
		senderId,
		senderName,
		ts: parent.getTs?.(),
		summary: summarizeEventForReply(parent),
		parentEvent: parent,
			msgtype: parent.getContent?.()?.msgtype,
	};
}

/**
 * Convenience: given a room/eventId (of the parent), build a preview directly.
 */
export async function buildReplyPreview(
	client: MatrixClient,
	roomId: string,
	parentEventId: string,
): Promise<ReplyPreviewModel | null> {
	const parent = await resolveParentEvent(client, roomId, parentEventId);
	if (!parent) return null;

	const room = client.getRoom(roomId) ?? undefined;
	const senderId = parent.getSender();
	const senderName = senderId ? room?.getMember(senderId)?.name ?? senderId : undefined;

	return {
		parentEventId,
		roomId,
		senderId,
		senderName,
		ts: parent.getTs?.(),
		summary: summarizeEventForReply(parent),
		parentEvent: parent,
			msgtype: parent.getContent?.()?.msgtype,
	};
}

