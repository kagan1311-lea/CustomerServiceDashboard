import { FormEvent, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "../components/AppLayout";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { useAuth } from "../context/AuthContext";
import { addMessage, getInquiry, updateInquiry } from "../api/inquiries";
import { listUsers, UserSummary } from "../api/users";
import {
  ALLOWED_STATUS_TRANSITIONS,
  Inquiry,
  InquiryMessage,
  InquiryPriority,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "../types/inquiry";

const ALL_PRIORITIES = Object.keys(PRIORITY_LABELS) as InquiryPriority[];

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [notFound, setNotFound] = useState(false);

  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAssign = user?.role === "ADMIN" || user?.role === "MANAGER";

  function load() {
    if (!id) return;
    getInquiry(id)
      .then(({ inquiry, messages }) => {
        setInquiry(inquiry);
        setMessages(messages);
      })
      .catch(() => setNotFound(true));
  }

  useEffect(() => {
    load();
    listUsers().then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status: string) {
    if (!inquiry) return;
    try {
      const updated = await updateInquiry(inquiry.id, { status: status as Inquiry["status"] });
      setInquiry(updated);
    } catch {
      setError("Could not update the status.");
    }
  }

  async function handlePriorityChange(priority: string) {
    if (!inquiry) return;
    const updated = await updateInquiry(inquiry.id, { priority: priority as InquiryPriority });
    setInquiry(updated);
  }

  async function handleAssign(agentId: string) {
    if (!inquiry) return;
    const updated = await updateInquiry(inquiry.id, { assignedUserId: agentId || null });
    setInquiry(updated);
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!inquiry || !replyContent.trim()) return;
    setSending(true);
    setError(null);
    try {
      const message = await addMessage(inquiry.id, { content: replyContent, isInternalNote });
      setMessages((prev) => [...prev, message]);
      setReplyContent("");
      setIsInternalNote(false);
    } catch {
      setError("Could not send the message.");
    } finally {
      setSending(false);
    }
  }

  if (notFound) {
    return (
      <AppLayout>
        <Alert severity="error">Inquiry not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/inquiries")}>
          Back to Inquiries
        </Button>
      </AppLayout>
    );
  }

  if (!inquiry) {
    return <AppLayout>Loading…</AppLayout>;
  }

  const agentsById = new Map(users.map((u) => [u.id, u.name]));
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[inquiry.status];

  return (
    <AppLayout>
      <Button component={RouterLink} to="/inquiries" size="small" sx={{ mb: 1 }}>
        ← Back to Inquiries
      </Button>

      <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "2fr 1fr" }} gap={2}>
        {/* Left column: conversation thread (spec.md section 13.4.1) */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {inquiry.subject}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box display="flex" flexDirection="column" gap={1.5} mb={2}>
              {messages.length === 0 && (
                <Typography color="text.secondary">No messages yet.</Typography>
              )}
              {messages.map((message) => (
                <Paper
                  key={message.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: message.isInternalNote
                      ? "warning.light"
                      : message.senderType === "CUSTOMER"
                        ? "grey.100"
                        : "info.light",
                    alignSelf: message.senderType === "CUSTOMER" ? "flex-start" : "flex-end",
                    maxWidth: "85%",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {message.senderType === "AGENT" && message.senderId
                      ? agentsById.get(message.senderId) ?? "Agent"
                      : message.senderType === "CUSTOMER"
                        ? inquiry.customerName
                        : "System"}
                    {message.isInternalNote ? " · Internal note" : ""} · {formatDate(message.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {message.content}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box component="form" onSubmit={handleSendReply} display="flex" flexDirection="column" gap={1}>
              <TextField
                placeholder="Write a reply or internal note…"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                multiline
                minRows={2}
              />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                    />
                  }
                  label="Internal note"
                />
                <Button type="submit" variant="contained" disabled={sending || !replyContent.trim()}>
                  {isInternalNote ? "Add Note" : "Send Reply"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right column: metadata & actions (spec.md section 13.4.2) */}
        <Card>
          <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Status
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <StatusBadge status={inquiry.status} />
                {allowedNextStatuses.length > 0 && (
                  <Select
                    size="small"
                    value=""
                    displayEmpty
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <MenuItem value="" disabled>
                      Move to…
                    </MenuItem>
                    {allowedNextStatuses.map((s) => (
                      <MenuItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </Box>
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary">
                Priority
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <PriorityBadge priority={inquiry.priority} />
                <Select size="small" value={inquiry.priority} onChange={(e) => handlePriorityChange(e.target.value)}>
                  {ALL_PRIORITIES.map((p) => (
                    <MenuItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary">
                Customer
              </Typography>
              <Typography variant="body2">{inquiry.customerName}</Typography>
              <Typography variant="body2">{inquiry.customerEmail}</Typography>
              {inquiry.customerPhone && <Typography variant="body2">{inquiry.customerPhone}</Typography>}
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Source: {SOURCE_LABELS[inquiry.source]}
                {inquiry.category ? ` · ${inquiry.category}` : ""}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary">
                Assigned Agent
              </Typography>
              {canAssign ? (
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={inquiry.assignedUserId ?? ""}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {users
                    .filter((u) => u.role === "AGENT")
                    .map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name}
                      </MenuItem>
                    ))}
                </Select>
              ) : (
                <Typography variant="body2">
                  {inquiry.assignedUserId ? agentsById.get(inquiry.assignedUserId) ?? "—" : "Unassigned"}
                </Typography>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="overline" color="text.secondary">
                Timeline
              </Typography>
              <Typography variant="body2">Created: {formatDate(inquiry.createdAt)}</Typography>
              <Typography variant="body2">Last updated: {formatDate(inquiry.updatedAt)}</Typography>
              {inquiry.closedAt && <Typography variant="body2">Closed: {formatDate(inquiry.closedAt)}</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AppLayout>
  );
}
