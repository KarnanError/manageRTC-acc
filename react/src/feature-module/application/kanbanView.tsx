import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import { Filter, MessageCircle, Paperclip, Plus, Search, X } from "react-feather";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import Footer from "../../core/common/footer";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import useKanbanBoard, { KanbanCard, KanbanColumn } from "../../hooks/useKanbanBoard";

const priorityTabs: Array<{ key: "all" | "High" | "Medium" | "Low"; label: string }> = [
  { key: "all", label: "All" },
  { key: "High", label: "High" },
  { key: "Medium", label: "Medium" },
  { key: "Low", label: "Low" },
];

const statusLabels: Record<string, string> = {
  new: "New",
  inprogress: "Inprogress",
  on_hold: "On-hold",
  completed: "Completed",
};

const priorityBadgeClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-purple";
    case "medium":
      return "bg-warning";
    case "low":
      return "bg-success";
    default:
      return "bg-secondary";
  }
};

const formatCurrency = (value: number) =>
  typeof value === "number" ? `$${value.toLocaleString()}` : "$0";

const formatDueDate = (value: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleDateString("en-GB");
};

const AvatarStack: React.FC<{ members: KanbanCard["teamMembers"] }> = ({ members }) => {
  if (!members?.length) {
    return (
      <span className="avatar avatar-rounded bg-soft-dark text-dark">
        <i className="ti ti-user" />
      </span>
    );
  }

  const visible = members.slice(0, 4);
  const remaining = members.length - visible.length;

  return (
    <div className="avatar-list-stacked avatar-group-sm me-3">
      {visible.map((member, index) => (
        <span className="avatar avatar-rounded" key={`${member.name}-${index}`}>
          {member.avatar ? (
            <ImageWithBasePath
              className="border border-white"
              src={member.avatar}
              alt={member.name}
            />
          ) : (
            <span className="avatar avatar-rounded bg-soft-primary text-primary fw-semibold">
              {member.name?.charAt(0) ?? "U"}
            </span>
          )}
        </span>
      ))}
      {remaining > 0 && (
        <Link to="#" className="avatar avatar-rounded bg-primary fs-12 text-white">
          {`+${remaining}`}
        </Link>
      )}
    </div>
  );
};

interface KanbanCardItemProps {
  card: KanbanCard;
  onEdit: (card: KanbanCard) => void;
  onDelete: (card: KanbanCard) => void;
}

type ModalState =
  | { type: "create"; columnKey: string }
  | { type: "edit"; card: KanbanCard }
  | { type: "delete"; card: KanbanCard }
  | null;

interface CardFormValues {
  columnKey: string;
  title: string;
  projectId: string;
  category: string;
  priority: "High" | "Medium" | "Low";
  budget: string;
  tasksCompleted: string;
  tasksTotal: string;
  dueDate: string;
  teamMembers: string;
  chatCount: string;
  attachmentCount: string;
}

const defaultFormValues: CardFormValues = {
  columnKey: "new",
  title: "",
  projectId: "",
  category: "Web Layout",
  priority: "High",
  budget: "0",
  tasksCompleted: "0",
  tasksTotal: "0",
  dueDate: "",
  teamMembers: "",
  chatCount: "0",
  attachmentCount: "0",
};

const buildFormValuesFromCard = (card: KanbanCard): CardFormValues => ({
  columnKey: card.columnKey,
  title: card.title || "",
  projectId: card.projectId || "",
  category: card.tags?.[0] || "Web Layout",
  priority: (card.priority as "High" | "Medium" | "Low") || "Medium",
  budget: String(card.budget ?? 0),
  tasksCompleted: String(card.tasks?.completed ?? 0),
  tasksTotal: String(card.tasks?.total ?? 0),
  dueDate: card.dueDate ? card.dueDate.slice(0, 10) : "",
  teamMembers: card.teamMembers?.map((member) => member.name).join(", ") || "",
  chatCount: String(card.chatCount ?? 0),
  attachmentCount: String(card.attachmentCount ?? 0),
});

interface KanbanCardFormModalProps {
  mode: "create" | "edit";
  columns: KanbanColumn[];
  values: CardFormValues;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onChange: (next: CardFormValues) => void;
  onSubmit: () => void;
}

const KanbanCardFormModal: React.FC<KanbanCardFormModalProps> = ({
  mode,
  columns,
  values,
  error,
  submitting,
  onClose,
  onChange,
  onSubmit,
}) => {
  const updateField = (field: keyof CardFormValues, value: string) => {
    onChange({
      ...values,
      [field]: value,
    });
  };

  return (
    <>
      <div className="modal custom-modal d-block" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">
                {mode === "create" ? "Add New Project" : "Edit Project"}
              </h4>
              <button type="button" className="btn-close" onClick={onClose}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Project Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={values.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Project Title"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Project ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={values.projectId}
                    onChange={(event) => updateField("projectId", event.target.value)}
                    placeholder="PRJ-001"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={values.category}
                    onChange={(event) => updateField("category", event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label d-block">Priority</label>
                  <div className="btn-group">
                    {["High", "Medium", "Low"].map((priority) => (
                      <button
                        type="button"
                        key={priority}
                        className={`btn btn-sm ${
                          values.priority === priority ? "btn-primary" : "btn-outline-primary"
                        }`}
                        onClick={() => updateField("priority", priority as "High" | "Medium" | "Low")}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Column</label>
                  <select
                    className="form-select"
                    value={values.columnKey}
                    onChange={(event) => updateField("columnKey", event.target.value)}
                  >
                    {columns
                      .sort((a, b) => a.order - b.order)
                      .map((column) => (
                        <option key={column._id} value={column.key}>
                          {statusLabels[column.key] || column.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Budget</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      className="form-control"
                      value={values.budget}
                      min="0"
                      onChange={(event) => updateField("budget", event.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Tasks Completed</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={values.tasksCompleted}
                    onChange={(event) => updateField("tasksCompleted", event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Total Tasks</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={values.tasksTotal}
                    onChange={(event) => updateField("tasksTotal", event.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={values.dueDate}
                    onChange={(event) => updateField("dueDate", event.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Team Members (comma separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={values.teamMembers}
                    onChange={(event) => updateField("teamMembers", event.target.value)}
                    placeholder="Alice, Bob"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Chat Count</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={values.chatCount}
                    onChange={(event) => updateField("chatCount", event.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Attachment Count</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={values.attachmentCount}
                    onChange={(event) => updateField("attachmentCount", event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-white" type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={onSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
};

interface DeleteCardModalProps {
  card: KanbanCard;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteCardModal: React.FC<DeleteCardModalProps> = ({
  card,
  submitting,
  error,
  onClose,
  onConfirm,
}) => (
  <>
    <div className="modal custom-modal d-block" role="dialog">
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Delete Project</h4>
            <button type="button" className="btn-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <p>
              Are you sure you want to delete <strong>{card.title || card.projectId}</strong>?
            </p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-white" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btn-danger" type="button" onClick={onConfirm} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div className="modal-backdrop fade show" />
  </>
);

const KanbanCardItem: React.FC<KanbanCardItemProps> = ({ card, onEdit, onDelete }) => (
  <div className="card kanban-card mb-2 shadow-none">
    <div className="card-body">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          {card.tags?.[0] && (
            <span className="badge bg-outline-dark me-2 text-uppercase">{card.tags[0]}</span>
          )}
          <span
            className={`badge ${priorityBadgeClass(
              card.priority
            )} badge-xs d-flex align-items-center justify-content-center`}
          >
            <i className="fas fa-circle fs-6 me-1" />
            {card.priority}
          </span>
        </div>
        <div className="dropdown">
          <Link to="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
            <i className="ti ti-dots-vertical" />
          </Link>
          <ul className="dropdown-menu dropdown-menu-end p-3">
            <li>
              <button
                type="button"
                className="dropdown-item rounded-1"
                onClick={() => onEdit(card)}
              >
                <i className="ti ti-edit me-2" />
                Edit
              </button>
            </li>
            <li>
              <button
                type="button"
                className="dropdown-item rounded-1"
                onClick={() => onDelete(card)}
              >
                <i className="ti ti-trash me-2" />
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="d-flex align-items-center mb-2">
        <span className="avatar avatar-xs rounded-circle bg-warning me-2">
          <ImageWithBasePath
            src="assets/img/icons/kanban-arrow.svg"
            className="w-auto h-auto"
            alt="Img"
          />
        </span>
        <h6 className="d-flex align-items-center mb-0">
          {card.title || "Untitled"}
          {card.projectId && <span className="fs-12 ms-2 text-gray">{card.projectId}</span>}
        </h6>
      </div>

      <div className="d-flex align-items-center border-bottom mb-3 pb-3">
        <div className="me-3 pe-3 border-end">
          <span className="fw-medium fs-12 d-block mb-1">Budget</span>
          <p className="fs-12 text-dark mb-0">{formatCurrency(card.budget)}</p>
        </div>
        <div className="me-3 pe-3 border-end">
          <span className="fw-medium fs-12 d-block mb-1">Tasks</span>
          <p className="fs-12 text-dark mb-0">
            {card.tasks?.completed ?? 0}/{card.tasks?.total ?? 0}
          </p>
        </div>
        <div>
          <span className="fw-medium fs-12 d-block mb-1">Due on</span>
          <p className="fs-12 text-dark mb-0">{formatDueDate(card.dueDate)}</p>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <AvatarStack members={card.teamMembers} />
        <div className="d-flex align-items-center">
          <div className="d-flex align-items-center text-dark me-2">
            <MessageCircle size={16} className="text-gray me-1" />
            {card.chatCount ?? 0}
          </div>
          <div className="d-flex align-items-center text-dark">
            <Paperclip size={16} className="text-gray me-1" />
            {card.attachmentCount ?? 0}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const KanbanView: React.FC = () => {
  const {
    board,
    columns,
    loading,
    error,
    stats,
    filters,
    updateFilters,
    moveCard,
    reorderColumn,
    refreshBoard,
    createCard,
    updateCard,
    deleteCard,
  } = useKanbanBoard();

  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([]);
  const [searchValue, setSearchValue] = useState(filters.search ?? "");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [formValues, setFormValues] = useState<CardFormValues>(defaultFormValues);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const totals = useMemo(() => {
    const totalTasks = stats.tasks.total;
    const completedTasks = stats.tasks.completed;
    const pendingTasks = Math.max(totalTasks - completedTasks, 0);
    return {
      totalTasks,
      pendingTasks,
      completedTasks,
    };
  }, [stats]);

  const handlePriorityChange = (priority: "all" | "High" | "Medium" | "Low") => {
    updateFilters({
      ...filters,
      priority,
    });
  };

  const handleSearchSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    updateFilters({
      ...filters,
      search: searchValue || undefined,
    });
  };

  const transformFormValuesToPayload = (values: CardFormValues) => ({
    columnKey: values.columnKey,
    projectId: values.projectId.trim(),
    title: values.title.trim(),
    tags: values.category ? [values.category.trim()] : [],
    priority: values.priority,
    budget: Number(values.budget) || 0,
    tasks: {
      completed: Math.min(Number(values.tasksCompleted) || 0, Number(values.tasksTotal) || 0),
      total: Number(values.tasksTotal) || 0,
    },
    dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
    teamMembers: values.teamMembers
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name })),
    chatCount: Number(values.chatCount) || 0,
    attachmentCount: Number(values.attachmentCount) || 0,
  });

  const openCreateModal = (columnKey: string) => {
    setFormValues({
      ...defaultFormValues,
      columnKey,
    });
    setModalState({ type: "create", columnKey });
    setModalError(null);
  };

  const openEditModal = (card: KanbanCard) => {
    setFormValues(buildFormValuesFromCard(card));
    setModalState({ type: "edit", card });
    setModalError(null);
  };

  const openDeleteModal = (card: KanbanCard) => {
    setModalState({ type: "delete", card });
    setModalError(null);
  };

  const closeModal = () => {
    setModalState(null);
    setModalError(null);
    setModalSubmitting(false);
  };

  const handleFormSubmit = async () => {
    if (!modalState || modalState.type === "delete") return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      const payload = transformFormValuesToPayload(formValues);
      if (modalState.type === "create") {
        await createCard(payload);
      } else if (modalState.type === "edit") {
        await updateCard(modalState.card._id, payload);
      }
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!modalState || modalState.type !== "delete") return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      await deleteCard(modalState.card._id);
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to delete card");
      setModalSubmitting(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumnIndex = localColumns.findIndex(
      (col) => col.key === source.droppableId
    );
    const destinationColumnIndex = localColumns.findIndex(
      (col) => col.key === destination.droppableId
    );

    if (sourceColumnIndex === -1 || destinationColumnIndex === -1) return;

    const updatedColumns = [...localColumns];
    const sourceColumn = { ...updatedColumns[sourceColumnIndex] };
    const destinationColumn = { ...updatedColumns[destinationColumnIndex] };

    const [movedCard] = sourceColumn.cards.splice(source.index, 1);
    if (!movedCard) return;

    if (sourceColumn.key === destinationColumn.key) {
      sourceColumn.cards.splice(destination.index, 0, movedCard);
      updatedColumns[sourceColumnIndex] = sourceColumn;
      setLocalColumns(updatedColumns);
      await reorderColumn(
        sourceColumn.key,
        sourceColumn.cards.map((card) => card._id)
      );
      return;
    }

    destinationColumn.cards.splice(destination.index, 0, movedCard);
    movedCard.columnKey = destinationColumn.key;
    updatedColumns[sourceColumnIndex] = sourceColumn;
    updatedColumns[destinationColumnIndex] = destinationColumn;
    setLocalColumns(updatedColumns);

    await moveCard(draggableId, destinationColumn.key, Date.now());
  };

  const buildExportRows = () =>
    columns.flatMap((column) =>
      column.cards.map((card) => ({
        Status: statusLabels[column.key] || column.label,
        Title: card.title || "",
        ProjectID: card.projectId || "",
        Category: card.tags?.[0] || "",
        Priority: card.priority,
        Budget: card.budget || 0,
        Tasks: `${card.tasks?.completed ?? 0}/${card.tasks?.total ?? 0}`,
        DueDate: formatDueDate(card.dueDate),
        ChatCount: card.chatCount ?? 0,
        AttachmentCount: card.attachmentCount ?? 0,
      }))
    );

  const exportAsPDF = () => {
    const rows = buildExportRows();
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(14);
    doc.text("Kanban Export", 14, 15);
    doc.setFontSize(10);
    rows.forEach((row, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(
        `${index + 1}. [${row.Status}] ${row.Title} (${row.ProjectID}) - ${row.Priority} | Budget: ${
          row.Budget
        } | Tasks: ${row.Tasks} | Due: ${row.DueDate} | Chats: ${row.ChatCount} | Attachments: ${
          row.AttachmentCount
        }`,
        14,
        y
      );
      y += 8;
    });
    doc.save("kanban-export.pdf");
  };

  const exportAsExcel = () => {
    const rows = buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kanban");
    XLSX.writeFile(workbook, "kanban-export.xlsx");
  };

  const handleExport = (type: "pdf" | "excel") => {
    if (!columns.length) {
      return;
    }
    if (type === "pdf") {
      exportAsPDF();
    } else {
      exportAsExcel();
    }
  };

  const renderColumns = () => {
    if (!localColumns.length) {
      return (
        <div className="text-center w-100 py-5">
          {loading ? "Loading board..." : "No columns available"}
        </div>
      );
    }

    return localColumns
      .sort((a, b) => a.order - b.order)
      .map((column) => (
        <div className="p-3 rounded bg-transparent-secondary w-100 me-3" key={column._id}>
          <div className="bg-white p-2 rounded mb-2">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <span
                  className="p-1 d-flex rounded-circle me-2"
                  style={{ backgroundColor: `${column.color}33` }}
                >
                  <span
                    className="rounded-circle d-block p-1"
                    style={{ backgroundColor: column.color }}
                  />
                </span>
                <h5 className="me-2 mb-0">{statusLabels[column.key] || column.label}</h5>
                <span className="badge bg-light rounded-pill">
                  {column.cards.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="dropdown">
                <Link to="#" className="d-inline-flex align-items-center" data-bs-toggle="dropdown">
                  <i className="ti ti-dots-vertical" />
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-edit me-2" />
                      Edit
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-trash me-2" />
                      Delete
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <Droppable droppableId={column.key}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`kanban-drag-wrap ${snapshot.isDraggingOver ? "bg-light" : ""}`}
              >
                {column.cards.map((card, index) => (
                  <Draggable draggableId={card._id} index={index} key={card._id}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                      >
                        <KanbanCardItem
                          card={card}
                          onEdit={openEditModal}
                          onDelete={openDeleteModal}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="pt-2">
            <button
              className="btn btn-white border border-dashed d-flex align-items-center justify-content-center w-100"
              onClick={() => openCreateModal(column.key)}
            >
              <Plus className="me-2" size={16} />
              New Project
            </button>
          </div>
        </div>
      ));
  };

  const renderModal = () => {
    if (!modalState) {
      return null;
    }

    if (modalState.type === "delete") {
      return (
        <DeleteCardModal
          card={modalState.card}
          submitting={modalSubmitting}
          error={modalError}
          onClose={closeModal}
          onConfirm={handleDeleteCard}
        />
      );
    }

    return (
      <KanbanCardFormModal
        mode={modalState.type === "create" ? "create" : "edit"}
        columns={columns}
        values={formValues}
        error={modalError}
        submitting={modalSubmitting}
        onClose={closeModal}
        onChange={setFormValues}
        onSubmit={handleFormSubmit}
      />
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Kanban View</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Application</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Kanban View
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
            <div className="dropdown me-2">
              <Link
                to="#"
                className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                data-bs-toggle="dropdown"
              >
                <i className="ti ti-file-export me-2" />
                Export
              </Link>
              <ul className="dropdown-menu dropdown-menu-end p-3">
                <li>
                  <button
                    type="button"
                    className="dropdown-item rounded-1"
                    onClick={() => handleExport("pdf")}
                  >
                    <i className="ti ti-file-type-pdf me-1" />
                    Export as PDF
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item rounded-1"
                    onClick={() => handleExport("excel")}
                  >
                    <i className="ti ti-file-type-xls me-1" />
                    Export as Excel
                  </button>
                </li>
              </ul>
            </div>
            <CollapseHeader />
          </div>
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h4>{board?.name || "Projects"}</h4>
            <div className="d-flex align-items-center flex-wrap row-gap-3">
              <div className="d-flex align-items-center me-3">
                <p className="mb-0 me-3 pe-3 border-end fs-14">
                  Total Task : <span className="text-dark">{totals.totalTasks}</span>
                </p>
                <p className="mb-0 me-3 pe-3 border-end fs-14">
                  Pending : <span className="text-dark">{totals.pendingTasks}</span>
                </p>
                <p className="mb-0 fs-14">
                  Completed : <span className="text-dark">{totals.completedTasks}</span>
                </p>
              </div>
              <form className="input-icon-start position-relative" onSubmit={handleSearchSubmit}>
                <span className="input-icon-addon">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Project"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </form>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3 align-items-center mb-3">
              <div className="col-lg-4">
                <div className="d-flex align-items-center flex-wrap row-gap-3">
                  <h6 className="me-2 mb-0">Priority</h6>
                  <ul className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs">
                    {priorityTabs.map((tab) => (
                      <li className="nav-item" key={tab.key}>
                        <button
                          type="button"
                          className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                            filters.priority === tab.key ? "active" : ""
                          }`}
                          onClick={() => handlePriorityChange(tab.key)}
                        >
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3">
                  <button className="btn btn-white d-inline-flex align-items-center me-2">
                    <Filter size={16} className="me-2" />
                    Filters
                  </button>
                  <div className="dropdown me-2">
                    <Link to="#" className="dropdown-toggle btn btn-white" data-bs-toggle="dropdown">
                      Clients
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          All Clients
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Sophie
                        </Link>
                      </li>
                      <li>
                        <Link to="#" className="dropdown-item rounded-1">
                          Cameron
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="d-flex align-items-start overflow-auto project-status pb-4">
                {renderColumns()}
              </div>
            </DragDropContext>
          </div>
        </div>
      </div>
      <Footer />
      {renderModal()}
    </div>
  );
};

export default KanbanView;

