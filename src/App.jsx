import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const MS_DAY = 1000 * 60 * 60 * 24;

const GROUPS = [
  { name: "Planejamento", color: "#7c5cff" },
  { name: "Desenvolvimento", color: "#22c55e" },
  { name: "Validação", color: "#f59e0b" },
  { name: "Implantação", color: "#06b6d4" },
  { name: "Pós-implantação", color: "#ec4899" },
];

const DEFAULT_BAR_COLORS = [
  "#475569",
  "#334155",
  "#2563eb",
  "#1e40af",
  "#0f766e",
  "#166534",
  "#92400e",
  "#9a3412",
  "#6d28d9",
  "#9d174d",
];

const LOCATIONS = [
  { id: "manaus", name: "Manaus", subtitle: "Operação Manaus" },
  { id: "jaguariuna", name: "Jaguariúna", subtitle: "Operação Jaguariúna" },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [msg, setMsg] = useState("");

  const [page, setPage] = useState("dashboard");
  const [selectedLocation, setSelectedLocation] = useState("");

  const [ganttItems, setGanttItems] = useState([]);
  const [postIts, setPostIts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [apis, setApis] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [trash, setTrash] = useState([]);

  const [selectedGanttIds, setSelectedGanttIds] = useState([]);
  const [selectedPostItIds, setSelectedPostItIds] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [selectedContractIds, setSelectedContractIds] = useState([]);
  const [selectedApiIds, setSelectedApiIds] = useState([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState([]);

  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("Todos");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("Todas");
  const [ticketSlaFilter, setTicketSlaFilter] = useState("Todos");

  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedGanttDetailId, setSelectedGanttDetailId] = useState("");

  const [ganttForm, setGanttForm] = useState({
    title: "",
    responsible: "",
    group: "Planejamento",
    start: "",
    end: "",
    status: "Pendente",
    progress: 0,
    color: "#64748b",
  });

  const [postItForm, setPostItForm] = useState({
    title: "",
    text: "",
    date: "",
    color: "#fef08a",
    criticality: "Média",
  });

  const [documentForm, setDocumentForm] = useState({
    title: "",
    category: "",
    description: "",
    color: "#2563eb",
    fileName: "",
    createdAt: "",
  });

  const [contractForm, setContractForm] = useState({
    title: "",
    company: "",
    expiration: "",
    status: "Ativo",
    color: "#16a34a",
    fileName: "",
    createdAt: "",
  });

  const [apiForm, setApiForm] = useState({
    name: "",
    endpoint: "",
    method: "GET",
    description: "",
    fileName: "",
    filePath: "",
    fileUrl: "",
  });

  const [apiUploadFile, setApiUploadFile] = useState(null);
  const [apiUploading, setApiUploading] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    title: "",
    requester: "",
    sector: "",
    category: "",
    priority: "Média",
    responsible: "",
    dueDate: "",
    description: "",
    status: "Aberto",
    fileName: "",
  });

  const [activityForm, setActivityForm] = useState({
    activity: "",
    description: "",
    responsible: "",
    owner: "",
    priority: "ALTA",
    status: "Em andamento",
    action: "",
    update: "",
    startDate: "",
    expectedDate: "",
    conclusionDate: "",
  });

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showGanttModal, setShowGanttModal] = useState(false);
  const [showPostItModal, setShowPostItModal] = useState(false);

  const selectedLocationInfo = LOCATIONS.find(
    (location) => location.id === selectedLocation
  );

  const locationStorageKey = session?.user?.email
    ? `forgo_location_${session.user.email}`
    : null;

  const storageKey =
    session?.user?.email && selectedLocation
      ? `forgo_data_${session.user.email}_${selectedLocation}`
      : null;

  useEffect(() => {
    const fontId = "forgo-inter-font";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }

    document.body.style.margin = "0";
    document.body.style.background = "#eef3f9";
    document.body.style.fontFamily = "'Inter', Arial, sans-serif";
    document.body.style.WebkitFontSmoothing = "antialiased";
    document.body.style.MozOsxFontSmoothing = "grayscale";
  }, []);

  useEffect(() => {
    if (!locationStorageKey) return;

    const savedLocation = localStorage.getItem(locationStorageKey);
    if (savedLocation && LOCATIONS.some((location) => location.id === savedLocation)) {
      setSelectedLocation(savedLocation);
    }
  }, [locationStorageKey]);

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setLoadingSession(false);
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!storageKey) return;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);

      setGanttItems(
        (parsed.ganttItems || []).map((item) => ({
          ...item,
          group: item.group || "Planejamento",
          progress: Number(item.progress || 0),
          color: item.color || groupColor(item.group || "Planejamento"),
        }))
      );

      setPostIts(parsed.postIts || []);
      setDocuments(parsed.documents || []);
      setContracts(parsed.contracts || []);
      setApis(parsed.apis || []);
      setTickets(parsed.tickets || []);
      setActivities(parsed.activities || []);
      setTrash(parsed.trash || []);
    } else {
      setGanttItems([]);
      setPostIts([]);
      setDocuments([]);
      setContracts([]);
      setApis([]);
      setTickets([]);
      setActivities([]);
      setTrash([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ganttItems,
        postIts,
        documents,
        contracts,
        apis,
        tickets,
        activities,
        trash,
      })
    );
  }, [ganttItems, postIts, documents, contracts, apis, tickets, activities, trash, storageKey]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoadingLogin(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      setMsg(err.message || "Erro ao entrar.");
    } finally {
      setLoadingLogin(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setPage("dashboard");
    setSelectedLocation("");
  }

  function handleChooseLocation(locationId) {
    setSelectedLocation(locationId);
    setPage("dashboard");

    if (locationStorageKey) {
      localStorage.setItem(locationStorageKey, locationId);
    }

    const nextStorageKey = session?.user?.email
      ? `forgo_data_${session.user.email}_${locationId}`
      : null;

    if (!nextStorageKey) return;

    const saved = localStorage.getItem(nextStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);

      setGanttItems(
        (parsed.ganttItems || []).map((item) => ({
          ...item,
          group: item.group || "Planejamento",
          progress: Number(item.progress || 0),
          color: item.color || groupColor(item.group || "Planejamento"),
        }))
      );
      setPostIts(parsed.postIts || []);
      setDocuments(parsed.documents || []);
      setContracts(parsed.contracts || []);
      setApis(parsed.apis || []);
      setTickets(parsed.tickets || []);
      setActivities(parsed.activities || []);
      setTrash(parsed.trash || []);
    } else {
      setGanttItems([]);
      setPostIts([]);
      setDocuments([]);
      setContracts([]);
      setApis([]);
      setTickets([]);
      setActivities([]);
      setTrash([]);
    }
  }

  function handleChangeLocation() {
    const confirmed = window.confirm(
      "Deseja trocar a localidade? Os dados atuais serão salvos e a nova localidade será carregada separadamente."
    );

    if (!confirmed) return;

    setSelectedLocation("");
    setPage("dashboard");
  }

  function formatDateBr(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  function daysUntil(dateString) {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString + "T00:00:00");
    return Math.ceil((target - today) / MS_DAY);
  }

  function getReminderState(dateString) {
    const diff = daysUntil(dateString);
    if (diff === null) return "normal";
    if (diff < 0) return "late";
    if (diff <= 2) return "warning";
    return "normal";
  }

  function criticalityColor(level) {
    if (level === "Alta") return "#dc2626";
    if (level === "Média") return "#d97706";
    return "#2563eb";
  }

  function ticketPriorityColor(priority) {
    if (priority === "Crítica") return "#dc2626";
    if (priority === "Alta") return "#ea580c";
    if (priority === "Média") return "#d97706";
    return "#2563eb";
  }

  function generateTicketNumber() {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `FT-${random}`;
  }

  function ticketDueState(dateString) {
    const diff = daysUntil(dateString);
    if (diff === null) return "normal";
    if (diff < 0) return "late";
    if (diff <= 2) return "warning";
    return "normal";
  }

  function activityPriorityStyle(priority) {
    if (priority === "ALTA") return { background: "#dc2626", color: "white" };
    if (priority === "MÉDIA") return { background: "#f59e0b", color: "#111827" };
    return { background: "#bbf7d0", color: "#166534" };
  }

  function activityStatusStyle(status) {
    if (status === "Concluído") return { background: "#15803d", color: "white" };
    if (status === "Em andamento") return { background: "#fde68a", color: "#92400e" };
    if (status === "Aguardando terceiro") return { background: "#bfdbfe", color: "#1d4ed8" };
    if (status === "Bloqueado") return { background: "#d1d5db", color: "#374151" };
    if (status === "Crítico") return { background: "#dc2626", color: "white" };
    return { background: "#e5e7eb", color: "#374151" };
  }

  function groupColor(groupName) {
    return GROUPS.find((group) => group.name === groupName)?.color || "#64748b";
  }

  function addDays(date, amount) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function parseLocalDate(dateString) {
    return new Date(dateString + "T00:00:00");
  }

  function toDateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function addGanttItem(e) {
    e.preventDefault();

    if (
      !ganttForm.title ||
      !ganttForm.responsible ||
      !ganttForm.start ||
      !ganttForm.end
    ) {
      alert("Preencha título, responsável, data de início e data final.");
      return;
    }

    if (parseLocalDate(ganttForm.end) < parseLocalDate(ganttForm.start)) {
      alert("A data final não pode ser anterior à data de início.");
      return;
    }

    const newItem = {
      id: Date.now(),
      title: ganttForm.title,
      responsible: ganttForm.responsible,
      group: ganttForm.group,
      start: ganttForm.start,
      end: ganttForm.end,
      status: ganttForm.status,
      progress: Math.max(0, Math.min(100, Number(ganttForm.progress) || 0)),
      color: ganttForm.color || groupColor(ganttForm.group),
    };

    setGanttItems([newItem, ...ganttItems]);
    setSelectedGanttDetailId(String(newItem.id));

    setGanttForm({
      title: "",
      responsible: "",
      group: "Planejamento",
      start: "",
      end: "",
      status: "Pendente",
      progress: 0,
      color: "#64748b",
    });

    setShowGanttModal(false);
  }

  function updateGanttStatus(id, newStatus) {
    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              progress: newStatus === "Concluída" ? 100 : item.progress,
            }
          : item
      )
    );
  }

  function updateGanttItem(id, updatedFields) {
    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedFields,
              progress: Math.max(0, Math.min(100, Number(updatedFields.progress ?? item.progress) || 0)),
            }
          : item
      )
    );
  }

  function toggleGroup(groupName) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }

  function addPostIt(e) {
    e.preventDefault();
    if (!postItForm.title || !postItForm.text || !postItForm.date) return;

    const newItem = {
      id: Date.now(),
      title: postItForm.title,
      text: postItForm.text,
      date: postItForm.date,
      color: postItForm.color,
      criticality: postItForm.criticality,
      createdAt: new Date().toLocaleString("pt-BR"),
    };

    setPostIts([newItem, ...postIts]);

    setPostItForm({
      title: "",
      text: "",
      date: "",
      color: "#fef08a",
      criticality: "Média",
    });

    setShowPostItModal(false);
  }

  function addDocument(e) {
    e.preventDefault();
    if (!documentForm.title || !documentForm.category) return;

    const newItem = {
      id: Date.now(),
      title: documentForm.title,
      category: documentForm.category,
      description: documentForm.description,
      color: documentForm.color,
      fileName: documentForm.fileName,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    setDocuments([newItem, ...documents]);

    setDocumentForm({
      title: "",
      category: "",
      description: "",
      color: "#2563eb",
      fileName: "",
      createdAt: "",
    });
  }

  function addContract(e) {
    e.preventDefault();
    if (!contractForm.title || !contractForm.company || !contractForm.expiration)
      return;

    const newItem = {
      id: Date.now(),
      title: contractForm.title,
      company: contractForm.company,
      expiration: contractForm.expiration,
      status: contractForm.status,
      color: contractForm.color,
      fileName: contractForm.fileName,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    setContracts([newItem, ...contracts]);

    setContractForm({
      title: "",
      company: "",
      expiration: "",
      status: "Ativo",
      color: "#16a34a",
      fileName: "",
      createdAt: "",
    });
  }

  async function addApi(e) {
    e.preventDefault();
    if (!apiForm.name || !apiForm.endpoint) return;

    setApiUploading(true);

    try {
      let uploadedFileData = {
        fileName: apiForm.fileName,
        filePath: apiForm.filePath,
        fileUrl: apiForm.fileUrl,
      };

      if (apiUploadFile) {
        const safeFileName = apiUploadFile.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");

        const filePath = `${selectedLocation || "geral"}/apis/${Date.now()}_${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("forgo-uploads")
          .upload(filePath, apiUploadFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("forgo-uploads")
          .getPublicUrl(filePath);

        uploadedFileData = {
          fileName: apiUploadFile.name,
          filePath,
          fileUrl: publicData?.publicUrl || "",
        };
      }

      const newItem = {
        id: Date.now(),
        ...apiForm,
        ...uploadedFileData,
        createdAt: new Date().toLocaleDateString("pt-BR"),
      };

      setApis([newItem, ...apis]);

      setApiForm({
        name: "",
        endpoint: "",
        method: "GET",
        description: "",
        fileName: "",
        filePath: "",
        fileUrl: "",
      });

      setApiUploadFile(null);
    } catch (err) {
      alert(
        err.message ||
          "Não foi possível fazer upload do arquivo. Verifique o bucket forgo-uploads no Supabase."
      );
    } finally {
      setApiUploading(false);
    }
  }

  function addTicket(e) {
    e.preventDefault();

    if (!ticketForm.title || !ticketForm.requester || !ticketForm.description) {
      alert("Preencha título, solicitante e descrição do chamado.");
      return;
    }

    const now = new Date().toLocaleString("pt-BR");

    const newItem = {
      id: Date.now(),
      ticketNumber: generateTicketNumber(),
      ...ticketForm,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: Date.now() + 1,
          text: `Chamado aberto por ${ticketForm.requester}`,
          date: now,
        },
      ],
    };

    setTickets([newItem, ...tickets]);

    setTicketForm({
      title: "",
      requester: "",
      sector: "",
      category: "",
      priority: "Média",
      responsible: "",
      dueDate: "",
      description: "",
      status: "Aberto",
      fileName: "",
    });
  }

  function updateTicketStatus(id, newStatus) {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== id) return ticket;

        const now = new Date().toLocaleString("pt-BR");

        return {
          ...ticket,
          status: newStatus,
          updatedAt: now,
          history: [
            ...(ticket.history || []),
            {
              id: Date.now(),
              text: `Status alterado para ${newStatus}`,
              date: now,
            },
          ],
        };
      })
    );
  }

  function addActivity(e) {
    e.preventDefault();

    if (!activityForm.activity || !activityForm.description) {
      alert("Preencha pelo menos a atividade e a descrição.");
      return;
    }

    const newItem = {
      id: Date.now(),
      ...activityForm,
      createdAt: new Date().toLocaleString("pt-BR"),
    };

    setActivities([newItem, ...activities]);

    setActivityForm({
      activity: "",
      description: "",
      responsible: "",
      owner: "",
      priority: "ALTA",
      status: "Em andamento",
      action: "",
      update: "",
      startDate: "",
      expectedDate: "",
      conclusionDate: "",
    });

    setShowActivityModal(false);
  }

  function updateActivity(id, field, value) {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function moveSelectedToTrash({
    type,
    sourceItems,
    selectedIds,
    setSourceItems,
    clearSelection,
  }) {
    if (selectedIds.length === 0) {
      alert("Selecione ao menos um item para excluir.");
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja enviar os itens selecionados para a lixeira?"
    );

    if (!confirmed) return;

    const selectedItems = sourceItems.filter((item) => selectedIds.includes(item.id));
    const remainingItems = sourceItems.filter((item) => !selectedIds.includes(item.id));

    const trashItems = selectedItems.map((item) => ({
      trashId: Date.now() + Math.random(),
      originalId: item.id,
      type,
      deletedAt: new Date().toLocaleString("pt-BR"),
      payload: item,
    }));

    setTrash((prev) => [...trashItems, ...prev]);
    setSourceItems(remainingItems);
    clearSelection([]);

    if (type === "gantt") {
      setSelectedGanttDetailId("");
    }
  }

  function restoreSelectedTrash() {
    if (selectedTrashIds.length === 0) {
      alert("Selecione ao menos um item da lixeira para restaurar.");
      return;
    }

    const confirmed = window.confirm("Deseja restaurar os itens selecionados?");
    if (!confirmed) return;

    const itemsToRestore = trash.filter((item) =>
      selectedTrashIds.includes(item.trashId)
    );

    itemsToRestore.forEach((item) => {
      if (item.type === "gantt") setGanttItems((prev) => [item.payload, ...prev]);
      if (item.type === "postit") setPostIts((prev) => [item.payload, ...prev]);
      if (item.type === "document") setDocuments((prev) => [item.payload, ...prev]);
      if (item.type === "contract") setContracts((prev) => [item.payload, ...prev]);
      if (item.type === "api") setApis((prev) => [item.payload, ...prev]);
      if (item.type === "ticket") setTickets((prev) => [item.payload, ...prev]);
      if (item.type === "activity") setActivities((prev) => [item.payload, ...prev]);
    });

    setTrash((prev) => prev.filter((item) => !selectedTrashIds.includes(item.trashId)));
    setSelectedTrashIds([]);
  }

  function deleteSelectedTrashPermanently() {
    if (selectedTrashIds.length === 0) {
      alert("Selecione ao menos um item da lixeira para excluir em definitivo.");
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir em definitivo os itens selecionados? Essa ação não poderá ser desfeita."
    );

    if (!confirmed) return;

    setTrash((prev) => prev.filter((item) => !selectedTrashIds.includes(item.trashId)));
    setSelectedTrashIds([]);
  }

  function toggleSelection(id, selectedIds, setSelectedIds) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  const dashboardTotals = useMemo(
    () => ({
      ganttItems: ganttItems.length,
      postIts: postIts.length,
      documents: documents.length,
      contracts: contracts.length,
      apis: apis.length,
      tickets: tickets.length,
      activities: activities.length,
      urgentTickets: tickets.filter((item) => ticketDueState(item.dueDate) !== "normal").length,
      urgentPostIts: postIts.filter((item) => getReminderState(item.date) !== "normal").length,
      trash: trash.length,
    }),
    [ganttItems, postIts, documents, contracts, apis, tickets, activities, trash]
  );

  function Header({ title, subtitle }) {
    return (
      <div style={styles.topbar}>
        <div style={styles.headerLeft}>
          <img
            src="/logo.png"
            alt="FORGO TECH"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <h1 style={styles.pageTitle}>{title}</h1>
            <p style={styles.pageSubtitle}>{subtitle}</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          {selectedLocationInfo && (
            <div style={styles.locationBadge}>
              <span style={styles.locationBadgeLabel}>Localidade</span>
              <strong>{selectedLocationInfo.name}</strong>
            </div>
          )}

          <button style={styles.changeLocationButton} onClick={handleChangeLocation}>
            Trocar localidade
          </button>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  function SelectionBar({ label, onDelete }) {
    return (
      <div style={styles.selectionBar}>
        <strong>{label}</strong>
        <button style={styles.deleteButton} onClick={onDelete}>
          Excluir selecionados
        </button>
      </div>
    );
  }

  function ProfessionalGanttChart() {
    const { rows, timeline, weekGroups } = useMemo(() => {
      if (ganttItems.length === 0) {
        const today = new Date();
        const start = addDays(today, -3);
        const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
        return { rows: [], timeline: days, weekGroups: buildWeekGroups(days) };
      }

      const itemDates = ganttItems.flatMap((item) => [
        parseLocalDate(item.start),
        parseLocalDate(item.end),
      ]);

      const minDate = new Date(Math.min(...itemDates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...itemDates.map((d) => d.getTime())));

      const start = addDays(minDate, -7);
      const end = addDays(maxDate, 28);
      const totalDays = Math.max(56, Math.ceil((end - start) / MS_DAY) + 1);

      const days = Array.from({ length: totalDays }, (_, i) => addDays(start, i));

      const grouped = GROUPS.map((group) => {
        const groupItems = ganttItems
          .filter((item) => item.group === group.name)
          .sort((a, b) => parseLocalDate(a.start) - parseLocalDate(b.start));

        if (groupItems.length === 0) return null;

        const groupEnd = new Date(
          Math.max(...groupItems.map((item) => parseLocalDate(item.end).getTime()))
        );

        const avgProgress =
          groupItems.reduce((acc, item) => acc + Number(item.progress || 0), 0) /
          groupItems.length;

        const header = {
          rowType: "group",
          group: group.name,
          groupColor: group.color,
          id: `group-${group.name}`,
          title: group.name,
          end: toDateKey(groupEnd),
          progress: Math.round(avgProgress),
          itemCount: groupItems.length,
        };

        if (collapsedGroups[group.name]) return [header];

        return [
          header,
          ...groupItems.map((item) => ({
            rowType: "task",
            group: group.name,
            groupColor: group.color,
            ...item,
          })),
        ];
      })
        .filter(Boolean)
        .flat();

      return {
        rows: grouped,
        timeline: days,
        weekGroups: buildWeekGroups(days),
      };
    }, [ganttItems, collapsedGroups]);

    const dayWidth = 34;
    const rowHeight = 42;
    const leftWidth = 560;
    const chartWidth = timeline.length * dayWidth;

    function buildWeekGroups(days) {
      const groups = [];
      let current = null;

      days.forEach((day) => {
        const monday = addDays(day, -((day.getDay() + 6) % 7));
        const key = monday.toISOString().slice(0, 10);

        if (!current || current.key !== key) {
          current = {
            key,
            label: monday.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            }),
            count: 1,
          };
          groups.push(current);
        } else {
          current.count += 1;
        }
      });

      return groups;
    }

    function dayOffset(dateString) {
      const target = parseLocalDate(dateString);
      const first = new Date(timeline[0]);
      first.setHours(0, 0, 0, 0);
      return Math.max(0, Math.round((target - first) / MS_DAY));
    }

    function durationDays(start, end) {
      return Math.max(1, Math.round((parseLocalDate(end) - parseLocalDate(start)) / MS_DAY) + 1);
    }

    function renderGroupBar(row, rowIndex) {
      const groupItems = ganttItems.filter((item) => item.group === row.group);
      if (groupItems.length === 0) return null;

      const groupStart = new Date(
        Math.min(...groupItems.map((item) => parseLocalDate(item.start).getTime()))
      );
      const groupEnd = new Date(
        Math.max(...groupItems.map((item) => parseLocalDate(item.end).getTime()))
      );

      const left = dayOffset(toDateKey(groupStart)) * dayWidth;
      const width =
        Math.max(1, Math.round((groupEnd - groupStart) / MS_DAY) + 1) * dayWidth;

      return (
        <div
          style={{
            ...styles.ganttGroupBar,
            left,
            top: rowIndex * rowHeight + 11,
            width,
            background: row.groupColor,
            borderColor: row.groupColor,
          }}
        >
          <span style={styles.ganttBarLabel}>
            {row.title} {row.progress}%
          </span>
        </div>
      );
    }

    function renderTaskBar(row, rowIndex) {
      const left = dayOffset(row.start) * dayWidth;
      const width = durationDays(row.start, row.end) * dayWidth;
      const progressWidth = Math.max(0, Math.min(100, Number(row.progress || 0)));

      return (
        <div
          style={{
            ...styles.ganttTaskBar,
            left,
            top: rowIndex * rowHeight + 13,
            width,
            borderColor: row.color || row.groupColor,
            background: "rgba(148, 163, 184, 0.42)",
          }}
        >
          <div
            style={{
              ...styles.ganttTaskProgress,
              width: `${progressWidth}%`,
              background: row.color || row.groupColor,
            }}
          />
          <span style={styles.ganttTaskLabel}>
            {row.title} {row.progress || 0}%
          </span>
        </div>
      );
    }

    return (
      <div style={styles.professionalGantt}>
        <div style={styles.ganttTitleBar}>Cronograma profissional</div>

        <div style={styles.ganttScroll}>
          <div style={{ ...styles.ganttLayout, minWidth: leftWidth + chartWidth }}>
            <div style={{ ...styles.ganttLeftTable, width: leftWidth }}>
              <div style={styles.ganttLeftHeader}>
                <div style={{ ...styles.ganttColAll, ...styles.ganttHeadText }}>ALL</div>
                <div style={{ ...styles.ganttColTask, ...styles.ganttHeadText }}>TASK NAME</div>
                <div style={{ ...styles.ganttColFinish, ...styles.ganttHeadText }}>
                  PLANNED FINISH
                </div>
                <div style={{ ...styles.ganttColProgress, ...styles.ganttHeadText }}>%</div>
              </div>

              {rows.length === 0 ? (
                <div style={styles.ganttEmptyDark}>Nenhum item cadastrado.</div>
              ) : (
                rows.map((row, index) => {
                  const isGroup = row.rowType === "group";
                  const selected =
                    row.rowType === "task" && selectedGanttIds.includes(row.id);

                  return (
                    <div
                      key={row.id}
                      style={{
                        ...styles.ganttLeftRow,
                        height: rowHeight,
                        borderLeft: `5px solid ${row.groupColor}`,
                        ...(isGroup ? styles.ganttGroupRow : {}),
                        ...(selected ? styles.ganttSelectedRow : {}),
                      }}
                    >
                      <div style={styles.ganttColAll}>{index + 1}</div>
                      <div
                        style={{
                          ...styles.ganttColTask,
                          paddingLeft: isGroup ? 8 : 40,
                        }}
                      >
                        {isGroup ? (
                          <button
                            type="button"
                            style={styles.groupToggle}
                            onClick={() => toggleGroup(row.group)}
                          >
                            {collapsedGroups[row.group] ? "⊞" : "⊟"}
                          </button>
                        ) : (
                          <input
                            type="checkbox"
                            style={{ marginRight: 10 }}
                            checked={selectedGanttIds.includes(row.id)}
                            onChange={() =>
                              toggleSelection(row.id, selectedGanttIds, setSelectedGanttIds)
                            }
                          />
                        )}

                        <span
                          style={{
                            ...styles.ganttTaskName,
                            ...(isGroup ? styles.ganttGroupName : {}),
                          }}
                        >
                          {row.title}
                        </span>
                      </div>
                      <div style={styles.ganttColFinish}>{formatDateBr(row.end)}</div>
                      <div style={styles.ganttColProgress}>{row.progress || 0}%</div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ ...styles.ganttTimeline, width: chartWidth }}>
              <div style={styles.weekHeader}>
                {weekGroups.map((week) => (
                  <div
                    key={week.key}
                    style={{
                      ...styles.weekCell,
                      width: week.count * dayWidth,
                    }}
                  >
                    {week.label.toUpperCase()}
                  </div>
                ))}
              </div>

              <div style={styles.dayHeader}>
                {timeline.map((day) => (
                  <div key={toDateKey(day)} style={styles.dayHeaderCell}>
                    <div>{["D", "S", "T", "Q", "Q", "S", "S"][day.getDay()]}</div>
                    <div>{String(day.getDate()).padStart(2, "0")}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  ...styles.timelineBody,
                  height: Math.max(rowHeight * rows.length, 84),
                }}
              >
                {timeline.map((day, index) => (
                  <div
                    key={toDateKey(day)}
                    style={{
                      ...styles.timelineColumn,
                      left: index * dayWidth,
                      width: dayWidth,
                      ...(day.getDay() === 0 || day.getDay() === 6
                        ? styles.timelineWeekend
                        : {}),
                    }}
                  />
                ))}

                {rows.map((row, index) =>
                  row.rowType === "group"
                    ? renderGroupBar(row, index)
                    : renderTaskBar(row, index)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function GanttDetailPanel() {
    const [editing, setEditing] = useState(false);
    const selectedItem =
      ganttItems.find((item) => String(item.id) === String(selectedGanttDetailId)) ||
      null;

    const [editForm, setEditForm] = useState({
      title: "",
      responsible: "",
      group: "Planejamento",
      start: "",
      end: "",
      status: "Pendente",
      progress: 0,
      color: "#64748b",
    });

    useEffect(() => {
      if (!selectedItem) return;
      setEditForm({
        title: selectedItem.title,
        responsible: selectedItem.responsible,
        group: selectedItem.group || "Planejamento",
        start: selectedItem.start,
        end: selectedItem.end,
        status: selectedItem.status,
        progress: selectedItem.progress || 0,
        color: selectedItem.color || groupColor(selectedItem.group || "Planejamento"),
      });
      setEditing(false);
    }, [selectedItem?.id]);

    if (ganttItems.length === 0) {
      return (
        <div style={styles.ganttDetailCard}>
          <h3 style={{ marginTop: 0 }}>Editar item</h3>
          <p>Nenhum item cadastrado.</p>
        </div>
      );
    }

    return (
      <div style={styles.ganttDetailCard}>
        <div style={styles.ganttDetailHeader}>
          <div>
            <h3 style={{ margin: 0 }}>Selecionar item para edição</h3>
            <p style={styles.smallText}>
              Escolha apenas um item na lista suspensa para editar. Assim o Gantt fica maior e mais limpo.
            </p>
          </div>

          <select
            style={styles.selectWide}
            value={selectedGanttDetailId}
            onChange={(e) => {
              setSelectedGanttDetailId(e.target.value);
              setEditing(false);
            }}
          >
            <option value="">Selecione um item</option>
            {ganttItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.group}
              </option>
            ))}
          </select>
        </div>

        {!selectedItem ? (
          <p style={styles.smallText}>Nenhum item selecionado.</p>
        ) : !editing ? (
          <div style={styles.selectedSummary}>
            <div>
              <strong style={{ fontSize: 18 }}>{selectedItem.title}</strong>
              <p style={styles.smallText}>
                Grupo: {selectedItem.group} | Responsável: {selectedItem.responsible}
              </p>
              <p style={styles.smallText}>
                Início: {formatDateBr(selectedItem.start)} | Fim: {formatDateBr(selectedItem.end)} | Progresso: {selectedItem.progress || 0}%
              </p>
              <p style={styles.smallText}>Status: {selectedItem.status}</p>
            </div>

            <div style={styles.detailActions}>
              <select
                style={styles.input}
                value={selectedItem.status}
                onChange={(e) => updateGanttStatus(selectedItem.id, e.target.value)}
              >
                <option>Pendente</option>
                <option>Em andamento</option>
                <option>Concluída</option>
              </select>

              <button style={styles.secondaryButton} onClick={() => setEditing(true)}>
                Editar item
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.editCard}>
            <h4 style={{ marginTop: 0 }}>Editar item Gantt</h4>

            <input
              style={styles.input}
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              placeholder="Título"
            />

            <input
              style={styles.input}
              value={editForm.responsible}
              onChange={(e) =>
                setEditForm({ ...editForm, responsible: e.target.value })
              }
              placeholder="Responsável"
            />

            <div style={styles.editGrid}>
              <div>
                <label style={styles.label}>Grupo</label>
                <select
                  style={styles.input}
                  value={editForm.group}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      group: e.target.value,
                      color: editForm.color || groupColor(e.target.value),
                    })
                  }
                >
                  {GROUPS.map((group) => (
                    <option key={group.name}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.input}
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option>Pendente</option>
                  <option>Em andamento</option>
                  <option>Concluída</option>
                </select>
              </div>
            </div>

            <div style={styles.editGrid}>
              <div>
                <label style={styles.label}>Data de início</label>
                <input
                  style={styles.input}
                  type="date"
                  value={editForm.start}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start: e.target.value })
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Data final</label>
                <input
                  style={styles.input}
                  type="date"
                  value={editForm.end}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end: e.target.value })
                  }
                />
              </div>
            </div>

            <div style={styles.editGrid}>
              <div>
                <label style={styles.label}>Progresso (%)</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) =>
                    setEditForm({ ...editForm, progress: e.target.value })
                  }
                />
              </div>

              <div>
                <label style={styles.label}>Cor da barra</label>
                <div style={styles.colorPickerRow}>
                  <input
                    style={styles.colorInputCompact}
                    type="color"
                    value={editForm.color}
                    onChange={(e) =>
                      setEditForm({ ...editForm, color: e.target.value })
                    }
                  />
                  <div style={styles.colorSwatches}>
                    {DEFAULT_BAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => setEditForm({ ...editForm, color })}
                        style={{
                          ...styles.swatch,
                          background: color,
                          outline:
                            editForm.color === color
                              ? "3px solid #111827"
                              : "1px solid #cbd5e1",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.editActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  if (
                    !editForm.title ||
                    !editForm.responsible ||
                    !editForm.start ||
                    !editForm.end
                  )
                    return;

                  if (parseLocalDate(editForm.end) < parseLocalDate(editForm.start)) {
                    alert("A data final não pode ser anterior à data de início.");
                    return;
                  }

                  updateGanttItem(selectedItem.id, editForm);
                  setEditing(false);
                }}
              >
                Salvar alteração
              </button>

              <button style={styles.cancelButton} onClick={() => setEditing(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderDashboard() {
    return (
      <>
        <Header
          title="Painel FORGO TECH"
          subtitle={`Bem-vindo, ${session.user.email} | Localidade: ${selectedLocationInfo?.name || "não selecionada"}`}
        />

        <div style={styles.cards}>
          <div style={styles.card}>
            <h3>Gantt</h3>
            <p>Total cadastrado: {dashboardTotals.ganttItems}</p>
          </div>

          <div style={styles.card}>
            <h3>Post-its</h3>
            <p>Total cadastrado: {dashboardTotals.postIts}</p>
          </div>

          <div style={styles.card}>
            <h3>Repositório</h3>
            <p>Total cadastrado: {dashboardTotals.documents}</p>
          </div>

          <div style={styles.card}>
            <h3>Contratos</h3>
            <p>Total cadastrado: {dashboardTotals.contracts}</p>
          </div>

          <div style={styles.card}>
            <h3>APIs</h3>
            <p>Total cadastrado: {dashboardTotals.apis}</p>
          </div>

          <div style={styles.card}>
            <h3>Chamados</h3>
            <p>Total cadastrado: {dashboardTotals.tickets}</p>
          </div>

          <div style={styles.card}>
            <h3>Gestão de Atividades</h3>
            <p>Total cadastrado: {dashboardTotals.activities}</p>
          </div>

          <div style={styles.card}>
            <h3>Chamados urgentes</h3>
            <p>Total: {dashboardTotals.urgentTickets}</p>
          </div>

          <div style={styles.card}>
            <h3>Post-its urgentes</h3>
            <p>Total: {dashboardTotals.urgentPostIts}</p>
          </div>

          <div style={styles.card}>
            <h3>Lixeira</h3>
            <p>Total de itens: {dashboardTotals.trash}</p>
          </div>
        </div>
      </>
    );
  }

  function renderGantt() {
    return (
      <>
        <Header
          title="Gantt"
          subtitle="Gestão profissional de atividades, cronograma e progresso"
        />

        <div style={styles.listCard}>
          <div style={styles.activityToolbar}>
            <div>
              <h3 style={{ margin: 0 }}>Cronograma profissional</h3>
              <p style={styles.smallText}>
                Visualização ampliada da Gantt, com criação por modal.
              </p>
            </div>

            <div style={styles.activityToolbarActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowGanttModal(true)}
              >
                + Novo item Gantt
              </button>

              <button
                style={styles.deleteButton}
                onClick={() =>
                  moveSelectedToTrash({
                    type: "gantt",
                    sourceItems: ganttItems,
                    selectedIds: selectedGanttIds,
                    setSourceItems: setGanttItems,
                    clearSelection: setSelectedGanttIds,
                  })
                }
              >
                Excluir selecionados
              </button>
            </div>
          </div>

          <ProfessionalGanttChart />
          <GanttDetailPanel />
        </div>

        {showGanttModal && (
          <div style={styles.activityModalOverlay}>
            <div style={styles.activityModalBox}>
              <div style={styles.activityModalHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>Novo item Gantt</h3>
                  <p style={styles.smallText}>
                    Cadastre a demanda e acompanhe no cronograma.
                  </p>
                </div>

                <button
                  style={styles.activityModalClose}
                  onClick={() => setShowGanttModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={addGanttItem}>
                <div style={styles.activityModalGrid}>
                  <input
                    style={styles.input}
                    placeholder="Título"
                    value={ganttForm.title}
                    onChange={(e) =>
                      setGanttForm({ ...ganttForm, title: e.target.value })
                    }
                  />

                  <input
                    style={styles.input}
                    placeholder="Responsável"
                    value={ganttForm.responsible}
                    onChange={(e) =>
                      setGanttForm({ ...ganttForm, responsible: e.target.value })
                    }
                  />

                  <select
                    style={styles.input}
                    value={ganttForm.group}
                    onChange={(e) =>
                      setGanttForm({
                        ...ganttForm,
                        group: e.target.value,
                        color: groupColor(e.target.value),
                      })
                    }
                  >
                    {GROUPS.map((group) => (
                      <option key={group.name}>{group.name}</option>
                    ))}
                  </select>

                  <div>
                    <label style={styles.label}>Data de início</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={ganttForm.start}
                      onChange={(e) =>
                        setGanttForm({ ...ganttForm, start: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Data prevista para o fim</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={ganttForm.end}
                      onChange={(e) =>
                        setGanttForm({ ...ganttForm, end: e.target.value })
                      }
                    />
                  </div>

                  <select
                    style={styles.input}
                    value={ganttForm.status}
                    onChange={(e) =>
                      setGanttForm({ ...ganttForm, status: e.target.value })
                    }
                  >
                    <option>Pendente</option>
                    <option>Em andamento</option>
                    <option>Concluída</option>
                  </select>

                  <div>
                    <label style={styles.label}>Progresso (%)</label>
                    <input
                      style={styles.input}
                      type="number"
                      min="0"
                      max="100"
                      value={ganttForm.progress}
                      onChange={(e) =>
                        setGanttForm({ ...ganttForm, progress: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Cor da barra</label>
                    <div style={styles.colorPickerRow}>
                      <input
                        style={styles.colorInputCompact}
                        type="color"
                        value={ganttForm.color}
                        onChange={(e) =>
                          setGanttForm({ ...ganttForm, color: e.target.value })
                        }
                      />

                      <div style={styles.colorSwatches}>
                        {DEFAULT_BAR_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            title={color}
                            onClick={() => setGanttForm({ ...ganttForm, color })}
                            style={{
                              ...styles.swatch,
                              background: color,
                              outline:
                                ganttForm.color === color
                                  ? "3px solid #111827"
                                  : "1px solid #cbd5e1",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={styles.activityModalActions}>
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => setShowGanttModal(false)}
                  >
                    Cancelar
                  </button>

                  <button style={styles.secondaryButton} type="submit">
                    Salvar item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }


  function renderPostIts() {
    return (
      <>
        <Header
          title="Post-its"
          subtitle="Lembretes independentes com alerta visual"
        />

        <div style={styles.listCard}>
          <div style={styles.activityToolbar}>
            <div>
              <h3 style={{ margin: 0 }}>Lista de post-its</h3>
              <p style={styles.smallText}>
                Visualização ampliada dos lembretes, com criação por modal.
              </p>
            </div>

            <div style={styles.activityToolbarActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowPostItModal(true)}
              >
                + Novo post-it
              </button>

              <button
                style={styles.deleteButton}
                onClick={() =>
                  moveSelectedToTrash({
                    type: "postit",
                    sourceItems: postIts,
                    selectedIds: selectedPostItIds,
                    setSourceItems: setPostIts,
                    clearSelection: setSelectedPostItIds,
                  })
                }
              >
                Excluir selecionados
              </button>
            </div>
          </div>

          {postIts.length === 0 ? (
            <p>Nenhum post-it cadastrado.</p>
          ) : (
            <div style={styles.postItBoard}>
              {postIts.map((item) => {
                const state = getReminderState(item.date);

                return (
                  <div key={item.id} style={styles.postItWrapper}>
                    <label style={styles.checkboxRowCompact}>
                      <input
                        type="checkbox"
                        checked={selectedPostItIds.includes(item.id)}
                        onChange={() =>
                          toggleSelection(item.id, selectedPostItIds, setSelectedPostItIds)
                        }
                      />
                      <span>Selecionar</span>
                    </label>

                    <div
                      style={{
                        ...styles.postIt,
                        background: item.color,
                        ...(state === "warning" ? styles.postItWarning : {}),
                        ...(state === "late" ? styles.postItLate : {}),
                      }}
                    >
                      <div style={styles.postItTop}>
                        <span
                          style={{
                            ...styles.postItCriticality,
                            color: criticalityColor(item.criticality),
                          }}
                        >
                          {item.criticality}
                        </span>
                      </div>

                      <div style={styles.postItTitle}>{item.title}</div>
                      <div style={styles.postItText}>{item.text}</div>
                      <div style={styles.postItDate}>{formatDateBr(item.date)}</div>

                      {state === "warning" && (
                        <div style={styles.postItBadgeWarning}>Vencendo</div>
                      )}

                      {state === "late" && (
                        <div style={styles.postItBadgeLate}>Vencido</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showPostItModal && (
          <div style={styles.activityModalOverlay}>
            <div style={styles.activityModalBox}>
              <div style={styles.activityModalHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>Novo post-it</h3>
                  <p style={styles.smallText}>
                    Cadastre um lembrete independente.
                  </p>
                </div>

                <button
                  style={styles.activityModalClose}
                  onClick={() => setShowPostItModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={addPostIt}>
                <div style={styles.activityModalGrid}>
                  <input
                    style={styles.input}
                    placeholder="Título"
                    value={postItForm.title}
                    onChange={(e) =>
                      setPostItForm({ ...postItForm, title: e.target.value })
                    }
                  />

                  <select
                    style={styles.input}
                    value={postItForm.criticality}
                    onChange={(e) =>
                      setPostItForm({ ...postItForm, criticality: e.target.value })
                    }
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </select>

                  <div>
                    <label style={styles.label}>Data</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={postItForm.date}
                      onChange={(e) =>
                        setPostItForm({ ...postItForm, date: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Cor do post-it</label>
                    <input
                      style={styles.colorInput}
                      type="color"
                      value={postItForm.color}
                      onChange={(e) =>
                        setPostItForm({ ...postItForm, color: e.target.value })
                      }
                    />
                  </div>
                </div>

                <textarea
                  style={styles.textarea}
                  placeholder="Texto do post-it"
                  value={postItForm.text}
                  onChange={(e) =>
                    setPostItForm({ ...postItForm, text: e.target.value })
                  }
                />

                <div style={styles.activityModalActions}>
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => setShowPostItModal(false)}
                  >
                    Cancelar
                  </button>

                  <button style={styles.secondaryButton} type="submit">
                    Salvar post-it
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }


  function renderDocuments() {
    return (
      <>
        <Header
          title="Repositório"
          subtitle="Documentos, procedimentos e registros"
        />

        <div style={styles.moduleLayout}>
          <div style={styles.formCard}>
            <h3>Novo documento</h3>
            <form onSubmit={addDocument}>
              <input
                style={styles.input}
                placeholder="Título"
                value={documentForm.title}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, title: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Categoria"
                value={documentForm.category}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, category: e.target.value })
                }
              />

              <textarea
                style={styles.textarea}
                placeholder="Descrição"
                value={documentForm.description}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, description: e.target.value })
                }
              />

              <label style={styles.label}>Cor do card</label>
              <input
                style={styles.colorInput}
                type="color"
                value={documentForm.color}
                onChange={(e) =>
                  setDocumentForm({ ...documentForm, color: e.target.value })
                }
              />

              <label style={styles.label}>Upload do arquivo</label>
              <input
                style={styles.input}
                type="file"
                onChange={(e) =>
                  setDocumentForm({
                    ...documentForm,
                    fileName: e.target.files?.[0]?.name || "",
                  })
                }
              />

              {documentForm.fileName && (
                <p style={styles.fileInfo}>
                  Arquivo selecionado: {documentForm.fileName}
                </p>
              )}

              <button style={styles.button} type="submit">
                Salvar documento
              </button>
            </form>
          </div>

          <div style={styles.listCard}>
            <SelectionBar
              label="Lista de documentos"
              onDelete={() =>
                moveSelectedToTrash({
                  type: "document",
                  sourceItems: documents,
                  selectedIds: selectedDocumentIds,
                  setSourceItems: setDocuments,
                  clearSelection: setSelectedDocumentIds,
                })
              }
            />

            {documents.length === 0 ? (
              <p>Nenhum documento cadastrado.</p>
            ) : (
              documents.map((item) => (
                <div key={item.id}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedDocumentIds.includes(item.id)}
                      onChange={() =>
                        toggleSelection(item.id, selectedDocumentIds, setSelectedDocumentIds)
                      }
                    />
                    <span>Selecionar para exclusão</span>
                  </label>

                  <div
                    style={{
                      ...styles.repositoryItem,
                      borderLeft: `10px solid ${item.color || "#2563eb"}`,
                    }}
                  >
                    <div style={styles.repositoryTop}>
                      <div>
                        <strong style={{ fontSize: "20px" }}>{item.title}</strong>
                        <p>Categoria: {item.category}</p>
                        <p>{item.description}</p>
                        {item.fileName && <p>Arquivo: {item.fileName}</p>}
                        <p>Data de inserção: {item.createdAt || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  function renderContracts() {
    return (
      <>
        <Header
          title="Contratos"
          subtitle="Acompanhamento contratual"
        />

        <div style={styles.moduleLayout}>
          <div style={styles.formCard}>
            <h3>Novo contrato</h3>
            <form onSubmit={addContract}>
              <input
                style={styles.input}
                placeholder="Título"
                value={contractForm.title}
                onChange={(e) =>
                  setContractForm({ ...contractForm, title: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Empresa"
                value={contractForm.company}
                onChange={(e) =>
                  setContractForm({ ...contractForm, company: e.target.value })
                }
              />

              <label style={styles.label}>Data de vencimento</label>
              <input
                style={styles.input}
                type="date"
                value={contractForm.expiration}
                onChange={(e) =>
                  setContractForm({ ...contractForm, expiration: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={contractForm.status}
                onChange={(e) =>
                  setContractForm({ ...contractForm, status: e.target.value })
                }
              >
                <option>Ativo</option>
                <option>Encerrado</option>
                <option>Em análise</option>
              </select>

              <label style={styles.label}>Cor do card</label>
              <input
                style={styles.colorInput}
                type="color"
                value={contractForm.color}
                onChange={(e) =>
                  setContractForm({ ...contractForm, color: e.target.value })
                }
              />

              <label style={styles.label}>Upload do contrato</label>
              <input
                style={styles.input}
                type="file"
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    fileName: e.target.files?.[0]?.name || "",
                  })
                }
              />

              {contractForm.fileName && (
                <p style={styles.fileInfo}>
                  Arquivo selecionado: {contractForm.fileName}
                </p>
              )}

              <button style={styles.button} type="submit">
                Salvar contrato
              </button>
            </form>
          </div>

          <div style={styles.listCard}>
            <SelectionBar
              label="Lista de contratos"
              onDelete={() =>
                moveSelectedToTrash({
                  type: "contract",
                  sourceItems: contracts,
                  selectedIds: selectedContractIds,
                  setSourceItems: setContracts,
                  clearSelection: setSelectedContractIds,
                })
              }
            />

            {contracts.length === 0 ? (
              <p>Nenhum contrato cadastrado.</p>
            ) : (
              contracts.map((item) => (
                <div key={item.id}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedContractIds.includes(item.id)}
                      onChange={() =>
                        toggleSelection(item.id, selectedContractIds, setSelectedContractIds)
                      }
                    />
                    <span>Selecionar para exclusão</span>
                  </label>

                  <div
                    style={{
                      ...styles.repositoryItem,
                      borderLeft: `10px solid ${item.color || "#16a34a"}`,
                    }}
                  >
                    <div style={styles.repositoryTop}>
                      <div>
                        <strong style={{ fontSize: "20px" }}>{item.title}</strong>
                        <p>Empresa: {item.company}</p>
                        <p>Vencimento: {formatDateBr(item.expiration)}</p>
                        <p>Status: {item.status}</p>
                        {item.fileName && <p>Arquivo: {item.fileName}</p>}
                        <p>Data de inserção: {item.createdAt || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  function renderApis() {
    return (
      <>
        <Header
          title="APIs"
          subtitle="Cadastro de integrações, endpoints e arquivos técnicos"
        />

        <div style={styles.moduleLayout}>
          <div style={styles.formCard}>
            <h3>Nova API</h3>
            <form onSubmit={addApi}>
              <input
                style={styles.input}
                placeholder="Nome da API"
                value={apiForm.name}
                onChange={(e) =>
                  setApiForm({ ...apiForm, name: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Endpoint"
                value={apiForm.endpoint}
                onChange={(e) =>
                  setApiForm({ ...apiForm, endpoint: e.target.value })
                }
              />

              <select
                style={styles.input}
                value={apiForm.method}
                onChange={(e) =>
                  setApiForm({ ...apiForm, method: e.target.value })
                }
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>

              <textarea
                style={styles.textarea}
                placeholder="Descrição"
                value={apiForm.description}
                onChange={(e) =>
                  setApiForm({ ...apiForm, description: e.target.value })
                }
              />

              <label style={styles.label}>Upload de arquivo técnico</label>
              <input
                style={styles.input}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setApiUploadFile(file);
                  setApiForm({
                    ...apiForm,
                    fileName: file?.name || "",
                    filePath: "",
                    fileUrl: "",
                  });
                }}
              />

              {apiForm.fileName && (
                <p style={styles.fileInfo}>
                  Arquivo selecionado: {apiForm.fileName}
                </p>
              )}

              <button style={styles.button} type="submit" disabled={apiUploading}>
                {apiUploading ? "Enviando arquivo..." : "Salvar API"}
              </button>
            </form>
          </div>

          <div style={styles.listCard}>
            <SelectionBar
              label="Lista de APIs"
              onDelete={() =>
                moveSelectedToTrash({
                  type: "api",
                  sourceItems: apis,
                  selectedIds: selectedApiIds,
                  setSourceItems: setApis,
                  clearSelection: setSelectedApiIds,
                })
              }
            />

            {apis.length === 0 ? (
              <p>Nenhuma API cadastrada.</p>
            ) : (
              apis.map((item) => (
                <div key={item.id}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedApiIds.includes(item.id)}
                      onChange={() =>
                        toggleSelection(item.id, selectedApiIds, setSelectedApiIds)
                      }
                    />
                    <span>Selecionar para exclusão</span>
                  </label>

                  <div style={styles.listItem}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>Endpoint: {item.endpoint}</p>
                      <p>Método: {item.method}</p>
                      <p>{item.description}</p>
                      <p>Data de inserção: {item.createdAt}</p>

                      {item.fileName && (
                        <p>
                          Arquivo:{" "}
                          {item.fileUrl ? (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.fileName}
                            </a>
                          ) : (
                            item.fileName
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  }


  function renderTickets() {
    const columns = ["Aberto", "Em análise", "Em atendimento", "Aguardando retorno", "Resolvido", "Encerrado"];
    const closedStatuses = ["Resolvido", "Encerrado"];

    const getTicketSlaLabel = (ticket) => {
      if (closedStatuses.includes(ticket.status)) return "Resolvido";
      const dueState = ticketDueState(ticket.dueDate);
      if (dueState === "late") return "Vencido";
      if (dueState === "warning") return "Vencendo";
      return "Dentro do prazo";
    };

    const filteredTickets = tickets.filter((ticket) => {
      const search = ticketSearch.trim().toLowerCase();

      const matchesSearch =
        !search ||
        (ticket.ticketNumber || "").toLowerCase().includes(search) ||
        (ticket.title || "").toLowerCase().includes(search) ||
        (ticket.requester || "").toLowerCase().includes(search) ||
        (ticket.responsible || "").toLowerCase().includes(search);

      const matchesStatus =
        ticketStatusFilter === "Todos" || ticket.status === ticketStatusFilter;

      const matchesPriority =
        ticketPriorityFilter === "Todas" || ticket.priority === ticketPriorityFilter;

      const matchesSla =
        ticketSlaFilter === "Todos" || getTicketSlaLabel(ticket) === ticketSlaFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesSla;
    });

    const ticketDashboard = {
      total: tickets.length,
      filtered: filteredTickets.length,
      open: tickets.filter((ticket) => !closedStatuses.includes(ticket.status)).length,
      resolved: tickets.filter((ticket) => closedStatuses.includes(ticket.status)).length,
      late: tickets.filter((ticket) => getTicketSlaLabel(ticket) === "Vencido").length,
      warning: tickets.filter((ticket) => getTicketSlaLabel(ticket) === "Vencendo").length,
      onTime: tickets.filter((ticket) => getTicketSlaLabel(ticket) === "Dentro do prazo").length,
    };

    return (
      <>
        <Header
          title="Chamados"
          subtitle="Fluxo de atendimento, busca por número, filtros, dashboard e SLA automático"
        />

        <div style={styles.moduleLayout}>
          <div style={styles.formCard}>
            <h3>Novo chamado</h3>

            <form onSubmit={addTicket}>
              <input
                style={styles.input}
                placeholder="Título do chamado"
                value={ticketForm.title}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, title: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Solicitante"
                value={ticketForm.requester}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, requester: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Setor"
                value={ticketForm.sector}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, sector: e.target.value })
                }
              />

              <input
                style={styles.input}
                placeholder="Categoria"
                value={ticketForm.category}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, category: e.target.value })
                }
              />

              <label style={styles.label}>Prioridade</label>
              <select
                style={styles.input}
                value={ticketForm.priority}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, priority: e.target.value })
                }
              >
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
                <option>Crítica</option>
              </select>

              <input
                style={styles.input}
                placeholder="Responsável"
                value={ticketForm.responsible}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, responsible: e.target.value })
                }
              />

              <label style={styles.label}>Prazo</label>
              <input
                style={styles.input}
                type="date"
                value={ticketForm.dueDate}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, dueDate: e.target.value })
                }
              />

              <label style={styles.label}>Status inicial</label>
              <select
                style={styles.input}
                value={ticketForm.status}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, status: e.target.value })
                }
              >
                {columns.map((column) => (
                  <option key={column}>{column}</option>
                ))}
              </select>

              <textarea
                style={styles.textarea}
                placeholder="Descrição do chamado"
                value={ticketForm.description}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, description: e.target.value })
                }
              />

              <label style={styles.label}>Anexo</label>
              <input
                style={styles.input}
                type="file"
                onChange={(e) =>
                  setTicketForm({
                    ...ticketForm,
                    fileName: e.target.files?.[0]?.name || "",
                  })
                }
              />

              {ticketForm.fileName && (
                <p style={styles.fileInfo}>
                  Arquivo selecionado: {ticketForm.fileName}
                </p>
              )}

              <button style={styles.button} type="submit">
                Abrir chamado
              </button>
            </form>
          </div>

          <div style={styles.listCard}>
            <SelectionBar
              label="Fluxo de chamados"
              onDelete={() =>
                moveSelectedToTrash({
                  type: "ticket",
                  sourceItems: tickets,
                  selectedIds: selectedTicketIds,
                  setSourceItems: setTickets,
                  clearSelection: setSelectedTicketIds,
                })
              }
            />

            <div style={styles.ticketDashboard}>
              <div style={styles.ticketDashboardCard}>
                <span>Total</span>
                <strong>{ticketDashboard.total}</strong>
              </div>

              <div style={styles.ticketDashboardCard}>
                <span>Em aberto</span>
                <strong>{ticketDashboard.open}</strong>
              </div>

              <div style={styles.ticketDashboardCard}>
                <span>Resolvidos</span>
                <strong>{ticketDashboard.resolved}</strong>
              </div>

              <div style={styles.ticketDashboardCardLate}>
                <span>Vencidos</span>
                <strong>{ticketDashboard.late}</strong>
              </div>

              <div style={styles.ticketDashboardCardWarning}>
                <span>Vencendo</span>
                <strong>{ticketDashboard.warning}</strong>
              </div>

              <div style={styles.ticketDashboardCardOk}>
                <span>No prazo</span>
                <strong>{ticketDashboard.onTime}</strong>
              </div>
            </div>

            <div style={styles.ticketFilters}>
              <input
                style={styles.input}
                placeholder="Buscar por número FT, título, solicitante ou responsável"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
              />

              <select
                style={styles.input}
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
              >
                <option>Todos</option>
                {columns.map((column) => (
                  <option key={column}>{column}</option>
                ))}
              </select>

              <select
                style={styles.input}
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
              >
                <option>Todas</option>
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
                <option>Crítica</option>
              </select>

              <select
                style={styles.input}
                value={ticketSlaFilter}
                onChange={(e) => setTicketSlaFilter(e.target.value)}
              >
                <option>Todos</option>
                <option>Dentro do prazo</option>
                <option>Vencendo</option>
                <option>Vencido</option>
                <option>Resolvido</option>
              </select>
            </div>

            <div style={styles.ticketFilterSummary}>
              Exibindo {ticketDashboard.filtered} de {ticketDashboard.total} chamados.
            </div>

            {tickets.length === 0 ? (
              <p>Nenhum chamado cadastrado.</p>
            ) : (
              <div style={styles.ticketBoard}>
                {columns.map((column) => {
                  const columnTickets = filteredTickets.filter(
                    (ticket) => ticket.status === column
                  );

                  return (
                    <div key={column} style={styles.ticketColumn}>
                      <div style={styles.ticketColumnHeader}>
                        <strong>{column}</strong>
                        <span style={styles.ticketCount}>{columnTickets.length}</span>
                      </div>

                      {columnTickets.length === 0 ? (
                        <p style={styles.ticketEmpty}>Sem chamados.</p>
                      ) : (
                        columnTickets.map((ticket) => {
                          const slaLabel = getTicketSlaLabel(ticket);

                          return (
                            <div key={ticket.id} style={styles.ticketCard}>
                              <label style={styles.checkboxRowCompact}>
                                <input
                                  type="checkbox"
                                  checked={selectedTicketIds.includes(ticket.id)}
                                  onChange={() =>
                                    toggleSelection(
                                      ticket.id,
                                      selectedTicketIds,
                                      setSelectedTicketIds
                                    )
                                  }
                                />
                                <span>Selecionar</span>
                              </label>

                              <div style={styles.ticketTop}>
                                <strong style={styles.ticketTitle}>
                                  {ticket.ticketNumber || "FT-S/N"} - {ticket.title}
                                </strong>

                                <span
                                  style={{
                                    ...styles.ticketPriority,
                                    background: ticketPriorityColor(ticket.priority),
                                  }}
                                >
                                  {ticket.priority}
                                </span>
                              </div>

                              <div
                                style={{
                                  ...styles.ticketSlaBadge,
                                  ...(slaLabel === "Vencido" ? styles.ticketSlaLate : {}),
                                  ...(slaLabel === "Vencendo" ? styles.ticketSlaWarning : {}),
                                  ...(slaLabel === "Dentro do prazo" ? styles.ticketSlaOk : {}),
                                  ...(slaLabel === "Resolvido" ? styles.ticketSlaResolved : {}),
                                }}
                              >
                                SLA: {slaLabel}
                              </div>

                              <p style={styles.smallText}>
                                Solicitante: {ticket.requester}
                              </p>

                              {ticket.sector && (
                                <p style={styles.smallText}>Setor: {ticket.sector}</p>
                              )}

                              {ticket.responsible && (
                                <p style={styles.smallText}>
                                  Responsável: {ticket.responsible}
                                </p>
                              )}

                              {ticket.dueDate && (
                                <p
                                  style={{
                                    ...styles.smallText,
                                    ...(slaLabel === "Vencido"
                                      ? styles.ticketLateText
                                      : {}),
                                    ...(slaLabel === "Vencendo"
                                      ? styles.ticketWarningText
                                      : {}),
                                  }}
                                >
                                  Prazo: {formatDateBr(ticket.dueDate)}
                                </p>
                              )}

                              <p style={styles.ticketDescription}>
                                {ticket.description}
                              </p>

                              {ticket.fileName && (
                                <p style={styles.fileInfo}>Anexo: {ticket.fileName}</p>
                              )}

                              <select
                                style={styles.input}
                                value={ticket.status}
                                onChange={(e) =>
                                  updateTicketStatus(ticket.id, e.target.value)
                                }
                              >
                                {columns.map((status) => (
                                  <option key={status}>{status}</option>
                                ))}
                              </select>

                              {(ticket.history || []).length > 0 && (
                                <details style={styles.ticketHistory}>
                                  <summary>Histórico</summary>

                                  {(ticket.history || []).map((event) => (
                                    <div key={event.id} style={styles.ticketHistoryItem}>
                                      <div>{event.text}</div>
                                      <small>{event.date}</small>
                                    </div>
                                  ))}
                                </details>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }



  function renderActivities() {
    const priorityOptions = ["ALTA", "MÉDIA", "BAIXA"];
    const statusOptions = [
      "Concluído",
      "Em andamento",
      "Aguardando terceiro",
      "Bloqueado",
      "Crítico",
    ];

    return (
      <>
        <Header
          title="Gestão de Atividades"
          subtitle="Controle operacional por item, responsável, prioridade, status e atualização"
        />

        <div style={styles.activityTableCardFull}>
          <div style={styles.activityToolbar}>
            <div>
              <h3 style={{ margin: 0 }}>Tabela de atividades</h3>
              <p style={styles.smallText}>
                Visualização ampliada em formato de planilha operacional.
              </p>
            </div>

            <div style={styles.activityToolbarActions}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowActivityModal(true)}
              >
                + Nova atividade
              </button>

              <button
                style={styles.deleteButton}
                onClick={() =>
                  moveSelectedToTrash({
                    type: "activity",
                    sourceItems: activities,
                    selectedIds: selectedActivityIds,
                    setSourceItems: setActivities,
                    clearSelection: setSelectedActivityIds,
                  })
                }
              >
                Excluir selecionados
              </button>
            </div>
          </div>

          <div style={styles.activityTableScroll}>
            <table style={styles.activityTable}>
              <thead>
                <tr>
                  <th style={styles.activityTh}>ITEM</th>
                  <th style={styles.activityTh}>ATIVIDADE</th>
                  <th style={styles.activityTh}>DESCRIÇÃO</th>
                  <th style={styles.activityTh}>RESPONSÁVEL</th>
                  <th style={styles.activityTh}>DONO</th>
                  <th style={styles.activityTh}>PRIORIDADE</th>
                  <th style={styles.activityTh}>STATUS</th>
                  <th style={styles.activityTh}>ATIVIDADE</th>
                  <th style={styles.activityTh}>ATUALIZAÇÃO</th>
                  <th style={styles.activityTh}>DATA INÍCIO</th>
                  <th style={styles.activityTh}>DATA PREVISTA</th>
                  <th style={styles.activityTh}>DATA CONCLUSÃO</th>
                </tr>
              </thead>

              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td style={styles.activityTd} colSpan="12">
                      Nenhuma atividade cadastrada.
                    </td>
                  </tr>
                ) : (
                  activities.map((item, index) => (
                    <tr key={item.id}>
                      <td style={styles.activityTd}>
                        <label style={styles.activityItemCell}>
                          <input
                            type="checkbox"
                            checked={selectedActivityIds.includes(item.id)}
                            onChange={() =>
                              toggleSelection(
                                item.id,
                                selectedActivityIds,
                                setSelectedActivityIds
                              )
                            }
                          />
                          <span>{index + 1}</span>
                        </label>
                      </td>

                      <td style={styles.activityTd}>
                        <textarea
                          style={styles.activityTextarea}
                          value={item.activity}
                          onChange={(e) =>
                            updateActivity(item.id, "activity", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <textarea
                          style={styles.activityTextareaLarge}
                          value={item.description}
                          onChange={(e) =>
                            updateActivity(item.id, "description", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <input
                          style={styles.activityInput}
                          value={item.responsible}
                          onChange={(e) =>
                            updateActivity(item.id, "responsible", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <input
                          style={styles.activityInput}
                          value={item.owner}
                          onChange={(e) =>
                            updateActivity(item.id, "owner", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <select
                          style={{
                            ...styles.activityPillSelect,
                            ...activityPriorityStyle(item.priority),
                          }}
                          value={item.priority}
                          onChange={(e) =>
                            updateActivity(item.id, "priority", e.target.value)
                          }
                        >
                          {priorityOptions.map((priority) => (
                            <option key={priority}>{priority}</option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.activityTd}>
                        <select
                          style={{
                            ...styles.activityPillSelect,
                            ...activityStatusStyle(item.status),
                          }}
                          value={item.status}
                          onChange={(e) =>
                            updateActivity(item.id, "status", e.target.value)
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>

                      <td style={styles.activityTd}>
                        <textarea
                          style={styles.activityTextareaLarge}
                          value={item.action}
                          onChange={(e) =>
                            updateActivity(item.id, "action", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <textarea
                          style={styles.activityTextareaLarge}
                          value={item.update}
                          onChange={(e) =>
                            updateActivity(item.id, "update", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <input
                          style={styles.activityDateInput}
                          type="date"
                          value={item.startDate}
                          onChange={(e) =>
                            updateActivity(item.id, "startDate", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <input
                          style={styles.activityDateInput}
                          type="date"
                          value={item.expectedDate}
                          onChange={(e) =>
                            updateActivity(item.id, "expectedDate", e.target.value)
                          }
                        />
                      </td>

                      <td style={styles.activityTd}>
                        <input
                          style={styles.activityDateInput}
                          type="date"
                          value={item.conclusionDate}
                          onChange={(e) =>
                            updateActivity(item.id, "conclusionDate", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showActivityModal && (
          <div style={styles.activityModalOverlay}>
            <div style={styles.activityModalBox}>
              <div style={styles.activityModalHeader}>
                <div>
                  <h3 style={{ margin: 0 }}>Nova atividade</h3>
                  <p style={styles.smallText}>
                    Cadastre a atividade e acompanhe depois pela tabela.
                  </p>
                </div>

                <button
                  style={styles.activityModalClose}
                  onClick={() => setShowActivityModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={addActivity}>
                <div style={styles.activityModalGrid}>
                  <input
                    style={styles.input}
                    placeholder="Atividade"
                    value={activityForm.activity}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, activity: e.target.value })
                    }
                  />

                  <input
                    style={styles.input}
                    placeholder="Responsável"
                    value={activityForm.responsible}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, responsible: e.target.value })
                    }
                  />

                  <input
                    style={styles.input}
                    placeholder="Dono"
                    value={activityForm.owner}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, owner: e.target.value })
                    }
                  />

                  <select
                    style={styles.input}
                    value={activityForm.priority}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, priority: e.target.value })
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>

                  <select
                    style={styles.input}
                    value={activityForm.status}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, status: e.target.value })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>

                  <input
                    style={styles.input}
                    placeholder="Atividade detalhada"
                    value={activityForm.action}
                    onChange={(e) =>
                      setActivityForm({ ...activityForm, action: e.target.value })
                    }
                  />

                  <div>
                    <label style={styles.label}>Data início</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={activityForm.startDate}
                      onChange={(e) =>
                        setActivityForm({ ...activityForm, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Data prevista</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={activityForm.expectedDate}
                      onChange={(e) =>
                        setActivityForm({ ...activityForm, expectedDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Data conclusão</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={activityForm.conclusionDate}
                      onChange={(e) =>
                        setActivityForm({
                          ...activityForm,
                          conclusionDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <textarea
                  style={styles.textarea}
                  placeholder="Descrição"
                  value={activityForm.description}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, description: e.target.value })
                  }
                />

                <textarea
                  style={styles.textarea}
                  placeholder="Atualização"
                  value={activityForm.update}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, update: e.target.value })
                  }
                />

                <div style={styles.activityModalActions}>
                  <button
                    type="button"
                    style={styles.cancelButton}
                    onClick={() => setShowActivityModal(false)}
                  >
                    Cancelar
                  </button>

                  <button style={styles.secondaryButton} type="submit">
                    Salvar atividade
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderTrash() {
    return (
      <>
        <Header
          title="Lixeira"
          subtitle="Itens excluídos com opção de restaurar ou excluir em definitivo"
        />

        <div style={styles.listCard}>
          <div style={styles.selectionBar}>
            <strong>Itens excluídos</strong>

            <div style={styles.trashActions}>
              <button style={styles.secondaryButton} onClick={restoreSelectedTrash}>
                Restaurar selecionados
              </button>

              <button style={styles.deleteButton} onClick={deleteSelectedTrashPermanently}>
                Excluir em definitivo
              </button>
            </div>
          </div>

          {trash.length === 0 ? (
            <p>Nenhum item na lixeira.</p>
          ) : (
            trash.map((item) => (
              <div key={item.trashId} style={styles.trashItem}>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedTrashIds.includes(item.trashId)}
                    onChange={() =>
                      toggleSelection(item.trashId, selectedTrashIds, setSelectedTrashIds)
                    }
                  />
                  <span>Selecionar</span>
                </label>

                <div>
                  <strong>Tipo: {item.type}</strong>
                  <p>
                    Título:{" "}
                    {item.payload.ticketNumber
                      ? `${item.payload.ticketNumber} - ${item.payload.title}`
                      : item.payload.title ||
                        item.payload.name ||
                        item.payload.category ||
                        "Sem título"}
                  </p>
                  <p>Excluído em: {item.deletedAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </>
    );
  }

  function renderPage() {
    if (page === "dashboard") return renderDashboard();
    if (page === "gantt") return renderGantt();
    if (page === "postit") return renderPostIts();
    if (page === "repositorio") return renderDocuments();
    if (page === "contratos") return renderContracts();
    if (page === "apis") return renderApis();
    if (page === "chamados") return renderTickets();
    if (page === "atividades") return renderActivities();
    if (page === "lixeira") return renderTrash();
    return renderDashboard();
  }

  if (loadingSession) {
    return (
      <div style={styles.centerScreen}>
        <h2>Carregando...</h2>
      </div>
    );
  }

  if (session && !selectedLocation) {
    return (
      <div style={styles.locationScreen}>
        <div style={styles.locationPanel}>
          <div style={styles.locationPanelHeader}>
            <img
              src="/logo.png"
              alt="FORGO TECH"
              style={styles.loginLogo}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <h1 style={styles.locationTitle}>Escolha a localidade</h1>
              <p style={styles.locationSubtitle}>
                Os módulos serão os mesmos, mas os dados ficarão separados por operação.
              </p>
            </div>
          </div>

          <div style={styles.locationCards}>
            {LOCATIONS.map((location) => (
              <button
                key={location.id}
                type="button"
                style={styles.locationCard}
                onClick={() => handleChooseLocation(location.id)}
              >
                <span style={styles.locationCardInitial}>
                  {location.name.slice(0, 1)}
                </span>
                <strong>{location.name}</strong>
                <small>{location.subtitle}</small>
              </button>
            ))}
          </div>

          <button style={styles.locationLogoutButton} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.leftLogin}>
          <div style={styles.loginBrand}>
            <img
              src="/logo.png"
              alt="FORGO TECH"
              style={styles.loginLogo}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div>
              <h1 style={{ margin: 0 }}>FORGO TECH</h1>
              <p style={{ marginTop: 8 }}>Portal interno de gestão</p>
            </div>
          </div>

          <h2 style={styles.loginHeadline}>
            Gantt, Post-its, repositório, contratos e APIs em um só lugar
          </h2>
        </div>

        <div style={styles.right}>
          <h2>Acessar sistema</h2>

          <form onSubmit={handleLogin}>
            <input
              style={styles.input}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={styles.button} type="submit">
              {loadingLogin ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {msg && <p style={{ color: "red" }}>{msg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <img
            src="/logo.png"
            alt="FORGO TECH"
            style={styles.sidebarLogo}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <h2 style={{ color: "white", margin: 0 }}>FORGO TECH</h2>
            <p style={{ color: "white", marginTop: 8 }}>Portal interno</p>
          </div>
        </div>

        <button style={styles.menuButton} onClick={() => setPage("dashboard")}>
          Dashboard
        </button>
        <button style={styles.menuButton} onClick={() => setPage("gantt")}>
          Gantt
        </button>
        <button style={styles.menuButton} onClick={() => setPage("postit")}>
          Post-it
        </button>
        <button style={styles.menuButton} onClick={() => setPage("repositorio")}>
          Repositório
        </button>
        <button style={styles.menuButton} onClick={() => setPage("contratos")}>
          Contratos
        </button>
        <button style={styles.menuButton} onClick={() => setPage("apis")}>
          APIs
        </button>
        <button style={styles.menuButton} onClick={() => setPage("chamados")}>
          Chamados
        </button>
        <button style={styles.menuButton} onClick={() => setPage("atividades")}>
          Gestão de Atividades
        </button>
        <button style={styles.menuButton} onClick={() => setPage("lixeira")}>
          Lixeira
        </button>
      </div>

      <div style={styles.content}>{renderPage()}</div>
    </div>
  );
}

const styles = {
  locationScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    boxSizing: "border-box",
    fontFamily: "'Inter', Arial, sans-serif",
    background:
      "radial-gradient(circle at 20% 20%, rgba(96,165,250,0.22), transparent 32%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 48%, #eef3f9 100%)",
  },
  locationPanel: {
    width: "min(920px, 100%)",
    background: "rgba(255,255,255,0.96)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: "28px",
    padding: "32px",
    boxShadow: "0 30px 80px rgba(15,23,42,0.28)",
  },
  locationPanelHeader: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    marginBottom: "28px",
  },
  locationTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "34px",
    fontWeight: 900,
    letterSpacing: "-0.05em",
  },
  locationSubtitle: {
    margin: "8px 0 0 0",
    color: "#64748b",
    fontWeight: 500,
  },
  locationCards: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  locationCard: {
    width: "100%",
    minHeight: "160px",
    border: "1px solid #dbe3ef",
    borderRadius: "24px",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    color: "#0f172a",
    cursor: "pointer",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "8px",
    textAlign: "left",
    boxShadow: "0 16px 34px rgba(15,23,42,0.08)",
    fontFamily: "'Inter', Arial, sans-serif",
  },
  locationCardInitial: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "22px",
    marginBottom: "6px",
  },
  locationLogoutButton: {
    marginTop: "22px",
    padding: "10px 16px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  locationBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    padding: "8px 12px",
    borderRadius: "14px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    lineHeight: 1.1,
  },
  locationBadgeLabel: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: "3px",
  },
  changeLocationButton: {
    padding: "10px 14px",
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 18px rgba(15,23,42,0.18)",
  },
  centerScreen: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "'Inter', Arial, sans-serif",
    background: "radial-gradient(circle at top left, #e0f2fe 0, #eef3f9 36%, #f8fafc 100%)",
    color: "#0f172a",
  },
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "'Inter', Arial, sans-serif",
    background: "linear-gradient(135deg, #eef3f9 0%, #f8fafc 100%)",
    color: "#0f172a",
  },
  leftLogin: {
    flex: 1,
    background:
      "radial-gradient(circle at 20% 20%, rgba(96,165,250,0.35), transparent 32%), linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "white",
    padding: "56px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  loginBrand: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  loginLogo: {
    width: "72px",
    height: "72px",
    objectFit: "contain",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "18px",
    padding: "8px",
    boxShadow: "0 18px 40px rgba(15,23,42,0.28)",
  },
  loginHeadline: {
    fontSize: "38px",
    lineHeight: 1.08,
    maxWidth: "560px",
    fontWeight: 900,
    letterSpacing: "-0.05em",
  },
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "40px",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #dbe3ef",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  selectWide: {
    display: "block",
    minWidth: "360px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #dbe3ef",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    outline: "none",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  textarea: {
    display: "block",
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    borderRadius: "12px",
    border: "1px solid #dbe3ef",
    boxSizing: "border-box",
    minHeight: "100px",
    resize: "vertical",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 500,
    outline: "none",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
  },
  label: {
    display: "block",
    fontSize: "14px",
    marginBottom: "6px",
    color: "#374151",
  },
  button: {
    width: "100%",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    boxShadow: "0 10px 20px rgba(37,99,235,0.22)",
  },
  secondaryButton: {
    padding: "10px 14px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: 700,
    boxShadow: "0 8px 16px rgba(37,99,235,0.18)",
  },
  cancelButton: {
    padding: "10px 14px",
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteButton: {
    padding: "10px 14px",
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontWeight: 700,
    boxShadow: "0 8px 16px rgba(220,38,38,0.18)",
  },
  logoutButton: {
    padding: "10px 16px",
    background: "linear-gradient(135deg, #b91c1c, #dc2626)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 10px 18px rgba(220,38,38,0.18)",
  },
  dashboard: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', Arial, sans-serif",
    background: "linear-gradient(180deg, #eef4fb 0%, #f8fafc 100%)",
    color: "#0f172a",
  },
  sidebar: {
    width: "268px",
    background:
      "radial-gradient(circle at 30% 0%, rgba(96,165,250,0.28), transparent 28%), linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)",
    padding: "24px",
    boxSizing: "border-box",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "18px 0 40px rgba(15,23,42,0.10)",
  },
  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  sidebarLogo: {
    width: "54px",
    height: "54px",
    objectFit: "contain",
    background: "rgba(255,255,255,0.96)",
    borderRadius: "16px",
    padding: "6px",
    boxShadow: "0 14px 28px rgba(0,0,0,0.20)",
  },
  menuButton: {
    display: "block",
    width: "100%",
    marginTop: "10px",
    padding: "13px 14px",
    background: "rgba(255,255,255,0.10)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "14px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 700,
    fontSize: "14px",
    transition: "all .18s ease",
  },
  content: {
    flex: 1,
    padding: "28px",
    boxSizing: "border-box",
    minWidth: 0,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.92)",
    padding: "22px",
    borderRadius: "22px",
    marginBottom: "24px",
    border: "1px solid rgba(226,232,240,0.95)",
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
    backdropFilter: "blur(12px)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logo: {
    width: "52px",
    height: "52px",
    objectFit: "contain",
    background: "white",
    borderRadius: "16px",
    padding: "6px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
  },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#0f172a",
  },
  pageSubtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontWeight: 500,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  card: {
    background: "rgba(255,255,255,0.94)",
    padding: "22px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 14px 30px rgba(15,23,42,0.06)",
  },
  moduleLayout: {
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
  },
  formCard: {
    background: "rgba(255,255,255,0.95)",
    padding: "22px",
    borderRadius: "22px",
    height: "fit-content",
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
  },
  listCard: {
    background: "rgba(255,255,255,0.95)",
    padding: "20px",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
  },
  selectionBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "12px",
    flexWrap: "wrap",
  },
  trashActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
    color: "#334155",
    fontSize: "14px",
  },
  checkboxRowCompact: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
    fontSize: "12px",
    color: "#334155",
  },
  professionalGantt: {
    background: "linear-gradient(180deg, #070f1e 0%, #0b1220 100%)",
    color: "#e5edf8",
    borderRadius: "18px",
    padding: "14px",
    border: "1px solid #1e293b",
    boxShadow: "0 24px 50px rgba(15, 23, 42, 0.22)",
  },
  ganttTitleBar: {
    fontSize: "13px",
    fontWeight: 900,
    marginBottom: "12px",
    letterSpacing: "0.12em",
    color: "#dbeafe",
    textTransform: "uppercase",
  },
  ganttScroll: {
    overflowX: "auto",
    overflowY: "hidden",
    border: "1px solid #26354f",
    borderRadius: "14px",
    background: "#0b1220",
    scrollbarColor: "#94a3b8 #0f172a",
  },
  ganttLayout: {
    display: "flex",
    alignItems: "stretch",
  },
  ganttLeftTable: {
    flex: "0 0 auto",
    background: "#0b1220",
    borderRight: "1px solid #334155",
  },
  ganttLeftHeader: {
    display: "flex",
    height: "56px",
    alignItems: "center",
    borderBottom: "1px solid #334155",
    background: "linear-gradient(180deg, #0b1220, #09111f)",
  },
  ganttHeadText: {
    color: "#93c5fd",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },
  ganttColAll: {
    width: "46px",
    padding: "0 10px",
    boxSizing: "border-box",
    color: "#cbd5e1",
  },
  ganttColTask: {
    width: "260px",
    padding: "0 10px",
    boxSizing: "border-box",
    color: "#e5edf8",
    display: "flex",
    alignItems: "center",
    minWidth: 0,
  },
  ganttColFinish: {
    width: "140px",
    padding: "0 10px",
    boxSizing: "border-box",
    color: "#f8fafc",
    fontWeight: 800,
  },
  ganttColProgress: {
    width: "72px",
    padding: "0 10px",
    boxSizing: "border-box",
    color: "#f8fafc",
    fontWeight: 800,
  },
  ganttLeftRow: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #1f2a44",
    background: "#0b1220",
  },
  ganttGroupRow: {
    background: "#111827",
    fontWeight: 900,
  },
  ganttSelectedRow: {
    background: "#073b57",
    outline: "1px solid #38bdf8",
    outlineOffset: "-1px",
  },
  groupToggle: {
    marginRight: 8,
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    cursor: "pointer",
    fontSize: "15px",
    padding: 0,
    width: "18px",
  },
  ganttTaskName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ganttGroupName: {
    fontWeight: 900,
  },
  ganttTimeline: {
    flex: "0 0 auto",
    position: "relative",
    background: "#0f172a",
  },
  weekHeader: {
    display: "flex",
    height: "28px",
    background: "#0b1220",
    borderBottom: "1px solid #334155",
  },
  weekCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#93c5fd",
    fontSize: "12px",
    fontWeight: 900,
    borderRight: "1px solid #26354f",
  },
  dayHeader: {
    display: "flex",
    height: "28px",
    background: "#0b1220",
    borderBottom: "1px solid #334155",
  },
  dayHeaderCell: {
    width: "34px",
    minWidth: "34px",
    color: "#cbd5e1",
    fontSize: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #26354f",
  },
  timelineBody: {
    position: "relative",
    background: "#0f172a",
  },
  timelineColumn: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRight: "1px solid #26354f",
  },
  timelineWeekend: {
    background: "rgba(148, 163, 184, 0.10)",
  },
  ganttGroupBar: {
    position: "absolute",
    height: "10px",
    borderTop: "3px solid",
    borderLeft: "3px solid",
    borderRight: "3px solid",
    borderRadius: "2px",
    boxSizing: "border-box",
    opacity: 0.86,
  },
  ganttBarLabel: {
    position: "absolute",
    left: "calc(100% + 8px)",
    top: "-4px",
    color: "#f8fafc",
    fontSize: "12px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
  },
  ganttTaskBar: {
    position: "absolute",
    height: "18px",
    border: "1px solid",
    borderRadius: "7px",
    boxSizing: "border-box",
    overflow: "visible",
    boxShadow: "0 6px 14px rgba(0,0,0,0.28)",
  },
  ganttTaskProgress: {
    height: "100%",
    opacity: 0.64,
    borderRadius: "6px",
  },
  ganttTaskLabel: {
    position: "absolute",
    left: "calc(100% + 8px)",
    top: "1px",
    color: "#f8fafc",
    fontSize: "12px",
    fontWeight: 900,
    whiteSpace: "nowrap",
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
  },
  ganttEmptyDark: {
    padding: "18px",
    color: "#94a3b8",
  },
  ganttDetailCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "20px",
    marginTop: "16px",
    boxShadow: "0 12px 26px rgba(15,23,42,0.05)",
  },
  ganttDetailHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  selectedSummary: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "16px",
  },
  detailActions: {
    width: "230px",
    minWidth: "230px",
  },
  smallText: {
    margin: "6px 0",
    color: "#4b5563",
  },
  editCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "14px",
  },
  editGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  editActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  colorPickerRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "12px",
  },
  colorInputCompact: {
    width: "54px",
    height: "42px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
  },
  colorSwatches: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  swatch: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
  postItBoard: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },
  postItWrapper: {
    minWidth: 0,
  },
  postIt: {
    minHeight: "145px",
    padding: "12px",
    borderRadius: "4px",
    boxShadow: "0 8px 14px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.08)",
    transform: "rotate(-1deg)",
    position: "relative",
  },
  postItTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  postItTitle: {
    fontSize: "16px",
    fontWeight: 800,
    color: "#111827",
    marginBottom: "8px",
    wordBreak: "break-word",
  },
  postItCriticality: {
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  postItText: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1f2937",
    lineHeight: 1.25,
    marginBottom: "14px",
    wordBreak: "break-word",
  },
  postItDate: {
    fontSize: "12px",
    color: "#374151",
    fontWeight: 700,
  },
  postItWarning: {
    outline: "3px solid #f59e0b",
  },
  postItLate: {
    outline: "3px solid #dc2626",
    boxShadow: "0 0 0 4px rgba(220,38,38,0.15), 0 8px 14px rgba(0,0,0,0.12)",
  },
  postItBadgeWarning: {
    marginTop: "10px",
    display: "inline-block",
    background: "#f59e0b",
    color: "white",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
  },
  postItBadgeLate: {
    marginTop: "10px",
    display: "inline-block",
    background: "#dc2626",
    color: "white",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 800,
  },
  colorInput: {
    display: "block",
    width: "100%",
    height: "48px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    background: "white",
    cursor: "pointer",
  },
  fileInfo: {
    fontSize: "13px",
    color: "#374151",
    marginBottom: "12px",
  },
  repositoryItem: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
    marginBottom: "14px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 10px 22px rgba(15,23,42,0.04)",
  },
  repositoryTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },


  activityPage: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
  },
  activityFormCard: {
    background: "rgba(255,255,255,0.95)",
    padding: "22px",
    borderRadius: "22px",
    height: "fit-content",
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
  },
  activityFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  activityTableCard: {
    background: "rgba(255,255,255,0.95)",
    padding: "20px",
    borderRadius: "22px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 34px rgba(15,23,42,0.06)",
  },
  activityTableScroll: {
    overflowX: "auto",
    border: "1px solid #111827",
    borderRadius: "12px",
    background: "#ffffff",
  },
  activityTable: {
    width: "1600px",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    fontSize: "12px",
    color: "#111827",
  },
  activityTh: {
    background: "#d9d9d9",
    color: "#111827",
    border: "1px solid #111827",
    padding: "10px 8px",
    textAlign: "center",
    fontWeight: 900,
    fontSize: "11px",
    letterSpacing: "0.04em",
  },
  activityTd: {
    border: "1px solid #111827",
    padding: "6px",
    verticalAlign: "middle",
    background: "#ffffff",
    minHeight: "56px",
  },
  activityItemCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontWeight: 800,
  },
  activityInput: {
    width: "100%",
    border: "none",
    outline: "none",
    textAlign: "center",
    fontSize: "12px",
    background: "transparent",
    fontWeight: 600,
    color: "#111827",
  },
  activityDateInput: {
    width: "100%",
    border: "none",
    outline: "none",
    textAlign: "center",
    fontSize: "12px",
    background: "transparent",
    fontWeight: 600,
    color: "#111827",
  },
  activityTextarea: {
    width: "100%",
    minHeight: "58px",
    border: "none",
    outline: "none",
    resize: "vertical",
    textAlign: "center",
    fontSize: "12px",
    background: "transparent",
    fontWeight: 700,
    color: "#111827",
    fontFamily: "'Inter', Arial, sans-serif",
  },
  activityTextareaLarge: {
    width: "100%",
    minHeight: "70px",
    border: "none",
    outline: "none",
    resize: "vertical",
    textAlign: "center",
    fontSize: "12px",
    background: "transparent",
    color: "#111827",
    fontFamily: "'Inter', Arial, sans-serif",
  },
  activityPillSelect: {
    width: "100%",
    border: "none",
    outline: "none",
    borderRadius: "999px",
    padding: "6px 8px",
    textAlign: "center",
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
  },

  ticketDashboard: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
    gap: "10px",
    marginBottom: "16px",
  },
  ticketDashboardCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#334155",
  },
  ticketDashboardCardLate: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#991b1b",
  },
  ticketDashboardCardWarning: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#92400e",
  },
  ticketDashboardCardOk: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#166534",
  },
  ticketFilters: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: "10px",
    marginBottom: "8px",
  },
  ticketFilterSummary: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 600,
    marginBottom: "14px",
  },
  ticketSlaBadge: {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "11px",
    fontWeight: 900,
    marginBottom: "8px",
  },
  ticketSlaLate: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  ticketSlaWarning: {
    background: "#fef3c7",
    color: "#92400e",
  },
  ticketSlaOk: {
    background: "#dcfce7",
    color: "#166534",
  },
  ticketSlaResolved: {
    background: "#e0f2fe",
    color: "#075985",
  },
  ticketBoard: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
    gap: "14px",
    alignItems: "start",
  },
  ticketColumn: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "12px",
    minHeight: "220px",
  },
  ticketColumnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    color: "#0f172a",
  },
  ticketCount: {
    minWidth: "28px",
    height: "24px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontWeight: 900,
    fontSize: "12px",
  },
  ticketEmpty: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: 0,
  },
  ticketCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "12px",
    boxShadow: "0 10px 22px rgba(15,23,42,0.05)",
  },
  ticketTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  ticketTitle: {
    fontSize: "15px",
    color: "#0f172a",
    lineHeight: 1.25,
  },
  ticketPriority: {
    color: "white",
    borderRadius: "999px",
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  ticketDescription: {
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.45,
    margin: "10px 0",
    whiteSpace: "pre-wrap",
  },
  ticketLateText: {
    color: "#dc2626",
    fontWeight: 900,
  },
  ticketWarningText: {
    color: "#d97706",
    fontWeight: 900,
  },
  ticketHistory: {
    marginTop: "10px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "8px",
    color: "#334155",
    fontSize: "13px",
  },
  ticketHistoryItem: {
    marginTop: "8px",
    padding: "8px",
    borderRadius: "10px",
    background: "#f8fafc",
  },
  trashItem: {
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "12px",
    background: "#fff",
    boxShadow: "0 10px 22px rgba(15,23,42,0.04)",
  },
};
