import { useState } from "react";
import dayjs from "dayjs";
import { CheckIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAppSelector } from "@/store";
import {
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useSetLeaveStatusMutation,
} from "@/store/api/attendanceApi";
import {
  Alert,
  Button,
  DataTable,
  type DataTableColumn,
  Dialog,
  FormField,
  IconButton,
  Select,
  StatusChip,
  Textarea,
  type ChipStatus,
} from "@/design";

export interface LeaveRequest {
  id: number;
  userId: number;
  restaurantId: number;
  branchId: number;
  leaveType: "CASUAL" | "SICK" | "EARNED" | "UNPAID";
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedById?: number | null;
  createdAt: string;
  user: { id: number; name: string };
}

interface LeaveManagementTabProps {
  allStaff: any[];
}

const LEAVE_TYPES = ["CASUAL", "SICK", "EARNED", "UNPAID"] as const;

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

const STATUS_TO_CHIP: Record<LeaveRequest["status"], ChipStatus> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export default function LeaveManagementTab({ allStaff }: LeaveManagementTabProps) {
  const { user } = useAppSelector((s) => s.auth);
  const { selectedBranch } = useAppSelector((s) => s.branch);

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formUserId, setFormUserId] = useState<string>("");
  const [formLeaveType, setFormLeaveType] = useState<(typeof LEAVE_TYPES)[number]>("CASUAL");
  const [formStartDate, setFormStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [formEndDate, setFormEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [formReason, setFormReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The status filter is part of the cache key, so flicking between All,
  // Pending and Approved reuses lists already fetched instead of asking again.
  const {
    data: requests = [],
    isFetching: loading,
    isError: error,
    refetch,
  } = useGetLeaveRequestsQuery(
    {
      restaurantId: user?.restaurantId as number,
      branchId: selectedBranch?.id as number,
      query: statusFilter !== "ALL" ? `?status=${statusFilter}` : "",
    },
    { skip: !user?.restaurantId || !selectedBranch?.id },
  );

  const [createLeaveRequest] = useCreateLeaveRequestMutation();
  const [setLeaveStatus] = useSetLeaveStatusMutation();

  const openAddDialog = () => {
    setFormUserId(allStaff[0] ? String(allStaff[0].id) : "");
    setFormLeaveType("CASUAL");
    setFormStartDate(dayjs().format("YYYY-MM-DD"));
    setFormEndDate(dayjs().format("YYYY-MM-DD"));
    setFormReason("");
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!selectedBranch?.id) return;
    if (!formUserId) {
      setFormError("Please select an employee");
      return;
    }
    if (dayjs(formEndDate).isBefore(dayjs(formStartDate))) {
      setFormError("End date cannot be before the start date");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createLeaveRequest({
        userId: Number(formUserId),
        branchId: selectedBranch.id,
        leaveType: formLeaveType,
        startDate: formStartDate,
        endDate: formEndDate,
        reason: formReason || undefined,
      }).unwrap();
      closeDialog();
    } catch {
      setFormError("Failed to submit leave request");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: number, status: "APPROVED" | "REJECTED") => {
    setActioningId(id);
    setActionError(null);
    try {
      // Invalidating Payroll as well as Leave is the point here: approved
      // unpaid leave changes what someone is owed, and the payroll tab used to
      // keep showing the pre-approval figure until it was reopened.
      await setLeaveStatus({ id, status, approvedById: user?.id }).unwrap();
    } catch {
      setActionError(`Failed to ${status === "APPROVED" ? "approve" : "reject"} this request`);
    } finally {
      setActioningId(null);
    }
  };

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (r) => <span className="font-semibold text-gray-900">{r.user?.name || "—"}</span>,
    },
    {
      key: "type",
      header: "Type",
      render: (r) => <StatusChip status="info">{r.leaveType}</StatusChip>,
    },
    {
      key: "dates",
      header: "Dates",
      render: (r) => (
        <span className="text-gray-700">
          {dayjs(r.startDate).format("DD MMM YYYY")} – {dayjs(r.endDate).format("DD MMM YYYY")}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="line-clamp-2 max-w-xs text-gray-500">{r.reason || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusChip status={STATUS_TO_CHIP[r.status]}>{r.status}</StatusChip>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) =>
        r.status === "PENDING" ? (
          <div className="flex justify-end gap-2">
            <IconButton
              aria-label="Approve leave request"
              icon={<CheckIcon className="h-3.5 w-3.5" />}
              variant="primary"
              disabled={actioningId === r.id}
              onClick={() => updateStatus(r.id, "APPROVED")}
            />
            <IconButton
              aria-label="Reject leave request"
              icon={<XMarkIcon className="h-3.5 w-3.5" />}
              variant="danger"
              disabled={actioningId === r.id}
              onClick={() => updateStatus(r.id, "REJECTED")}
            />
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="danger" title="Couldn't load leave requests">
          Something went wrong fetching leave requests for this branch. Try switching filters or refreshing.
        </Alert>
      )}
      {actionError && (
        <Alert variant="danger" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 text-[12px] font-semibold transition ${
                statusFilter === s ? "bg-[#b10000] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          leftIcon={<PlusIcon className="h-3.5 w-3.5" />}
          onClick={openAddDialog}
          disabled={allStaff.length === 0}
        >
          Add Leave Request
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <DataTable
          columns={columns}
          rows={requests} pageSize={10} rowNoun="leave requests"
          rowKey={(r) => r.id}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No leave requests found"
          emptyDescription="Leave requests submitted by or on behalf of staff for this branch will show up here."
        />
      </div>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title="Add Leave Request"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Submit Request
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <Alert variant="danger" className="text-[11px]">
              {formError}
            </Alert>
          )}

          <FormField label="Employee" required>
            <Select value={formUserId} onChange={(e) => setFormUserId(e.target.value)}>
              {allStaff.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Leave Type" required>
            <Select
              value={formLeaveType}
              onChange={(e) => setFormLeaveType(e.target.value as (typeof LEAVE_TYPES)[number])}
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Start Date" required>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="h-10 w-full rounded-input border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              />
            </FormField>
            <FormField label="End Date" required>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="h-10 w-full rounded-input border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
              />
            </FormField>
          </div>

          <FormField label="Reason">
            <Textarea
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="Optional reason for the leave"
            />
          </FormField>
        </div>
      </Dialog>
    </div>
  );
}
