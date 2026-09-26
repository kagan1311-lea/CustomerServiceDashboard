import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AppLayout } from "../components/AppLayout";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { createInquiry, downloadInquiriesCsv, listInquiries } from "../api/inquiries";
import { listUsers, UserSummary } from "../api/users";
import {
  Inquiry,
  InquiryPriority,
  InquirySource,
  InquiryStatus,
  PRIORITY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from "../types/inquiry";

const ALL_STATUSES = Object.keys(STATUS_LABELS) as InquiryStatus[];
const ALL_PRIORITIES = Object.keys(PRIORITY_LABELS) as InquiryPriority[];
const ALL_SOURCES = Object.keys(SOURCE_LABELS) as InquirySource[];

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function InquiriesListPage() {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<InquiryStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<InquiryPriority[]>([]);
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "priority" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [createOpen, setCreateOpen] = useState(false);

  const agentsById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  const params = useMemo(
    () => ({
      status: statusFilter.length ? statusFilter : undefined,
      priority: priorityFilter.length ? priorityFilter : undefined,
      agentId: agentFilter || undefined,
      search: search || undefined,
      sortBy,
      sortDir,
    }),
    [statusFilter, priorityFilter, agentFilter, search, sortBy, sortDir]
  );

  useEffect(() => {
    listUsers().then(setUsers);
  }, []);

  useEffect(() => {
    setLoading(true);
    listInquiries(params)
      .then(setInquiries)
      .finally(() => setLoading(false));
  }, [params]);

  function toggleSort(field: typeof sortBy) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  }

  return (
    <AppLayout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5">Inquiries</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => downloadInquiriesCsv(params)}>
            Export CSV
          </Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            New Inquiry
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <TextField
          label="Search"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Subject or customer name…"
          sx={{ minWidth: 220 }}
        />
        <Select
          multiple
          displayEmpty
          size="small"
          value={statusFilter}
          onChange={(e: SelectChangeEvent<InquiryStatus[]>) =>
            setStatusFilter(
              typeof e.target.value === "string" ? (e.target.value.split(",") as InquiryStatus[]) : e.target.value
            )
          }
          renderValue={(selected) =>
            selected.length === 0 ? "Status" : selected.map((s) => STATUS_LABELS[s]).join(", ")
          }
          sx={{ minWidth: 180 }}
        >
          {ALL_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </Select>
        <Select
          multiple
          displayEmpty
          size="small"
          value={priorityFilter}
          onChange={(e: SelectChangeEvent<InquiryPriority[]>) =>
            setPriorityFilter(
              typeof e.target.value === "string"
                ? (e.target.value.split(",") as InquiryPriority[])
                : e.target.value
            )
          }
          renderValue={(selected) =>
            selected.length === 0 ? "Priority" : selected.map((p) => PRIORITY_LABELS[p]).join(", ")
          }
          sx={{ minWidth: 180 }}
        >
          {ALL_PRIORITIES.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </MenuItem>
          ))}
        </Select>
        <Select
          displayEmpty
          size="small"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          renderValue={(value) => (value ? agentsById.get(value as string) ?? "Agent" : "Agent")}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All agents</MenuItem>
          {users.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Source</TableCell>
              <TableCell onClick={() => toggleSort("status")} sx={{ cursor: "pointer" }}>
                Status {sortBy === "status" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </TableCell>
              <TableCell onClick={() => toggleSort("priority")} sx={{ cursor: "pointer" }}>
                Priority {sortBy === "priority" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </TableCell>
              <TableCell>Assigned Agent</TableCell>
              <TableCell onClick={() => toggleSort("createdAt")} sx={{ cursor: "pointer" }}>
                Created {sortBy === "createdAt" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </TableCell>
              <TableCell onClick={() => toggleSort("updatedAt")} sx={{ cursor: "pointer" }}>
                Updated {sortBy === "updatedAt" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && inquiries.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box py={4} textAlign="center">
                    <Typography color="text.secondary">No inquiries match these filters.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {inquiries.map((inquiry) => (
              <TableRow
                key={inquiry.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/inquiries/${inquiry.id}`)}
              >
                <TableCell>{inquiry.subject}</TableCell>
                <TableCell>{inquiry.customerName}</TableCell>
                <TableCell>{SOURCE_LABELS[inquiry.source]}</TableCell>
                <TableCell>
                  <StatusBadge status={inquiry.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={inquiry.priority} />
                </TableCell>
                <TableCell>
                  {inquiry.assignedUserId ? agentsById.get(inquiry.assignedUserId) ?? "—" : "Unassigned"}
                </TableCell>
                <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                <TableCell>{formatDate(inquiry.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateInquiryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(inquiry) => {
          setCreateOpen(false);
          setInquiries((prev) => [inquiry, ...prev]);
        }}
      />
    </AppLayout>
  );
}

function CreateInquiryDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (inquiry: Inquiry) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [source, setSource] = useState<InquirySource>("PHONE");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const inquiry = await createInquiry({ customerName, customerEmail, subject, source, message });
      setCustomerName("");
      setCustomerEmail("");
      setSubject("");
      setMessage("");
      onCreated(inquiry);
    } catch {
      setError("Could not create the inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>New Inquiry</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error && <Chip color="error" label={error} />}
          <TextField
            label="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <TextField
            label="Customer Email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <Select value={source} onChange={(e) => setSource(e.target.value as InquirySource)}>
            {ALL_SOURCES.map((s) => (
              <MenuItem key={s} value={s}>
                {SOURCE_LABELS[s]}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            Create
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
