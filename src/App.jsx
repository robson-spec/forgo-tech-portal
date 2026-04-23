import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [msg, setMsg] = useState("");

  const [page, setPage] = useState("dashboard");

  const [ganttItems, setGanttItems] = useState([]);
  const [postIts, setPostIts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [apis, setApis] = useState([]);
  const [trash, setTrash] = useState([]);

  const [selectedGanttIds, setSelectedGanttIds] = useState([]);
  const [selectedPostItIds, setSelectedPostItIds] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [selectedContractIds, setSelectedContractIds] = useState([]);
  const [selectedApiIds, setSelectedApiIds] = useState([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState([]);

  const [ganttForm, setGanttForm] = useState({
    title: "",
    responsible: "",
    start: "",
    end: "",
    status: "Pendente",
    comment: "",
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
  });

  const storageKey = session?.user?.email
    ? `forgo_data_${session.user.email}`
    : null;

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
      setGanttItems(parsed.ganttItems || []);
      setPostIts(parsed.postIts || []);
      setDocuments(parsed.documents || []);
      setContracts(parsed.contracts || []);
      setApis(parsed.apis || []);
      setTrash(parsed.trash || []);
    } else {
      setGanttItems([]);
      setPostIts([]);
      setDocuments([]);
      setContracts([]);
      setApis([]);
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
        trash,
      })
    );
  }, [ganttItems, postIts, documents, contracts, apis, trash, storageKey]);

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
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
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

  function ganttBarColor(status) {
    if (status === "Concluída") return "#16a34a";
    if (status === "Em andamento") return "#f59e0b";
    return "#2563eb";
  }

  function monthLabel(date) {
    return date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
  }

  function isToday(date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function addGanttItem(e) {
    e.preventDefault();

    if (
      !ganttForm.title ||
      !ganttForm.responsible ||
      !ganttForm.start ||
      !ganttForm.end
    ) {
      return;
    }

    const newItem = {
      id: Date.now(),
      title: ganttForm.title,
      responsible: ganttForm.responsible,
      start: ganttForm.start,
      end: ganttForm.end,
      status: ganttForm.status,
      comments: ganttForm.comment
        ? [
            {
              id: Date.now() + 1,
              text: ganttForm.comment,
              date: new Date().toLocaleString("pt-BR"),
            },
          ]
        : [],
      dayNotes: {},
      chatMessages: [],
    };

    setGanttItems([newItem, ...ganttItems]);

    setGanttForm({
      title: "",
      responsible: "",
      start: "",
      end: "",
      status: "Pendente",
      comment: "",
    });
  }

  function addGanttComment(id, text) {
    if (!text.trim()) return;

    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              comments: [
                ...(item.comments || []),
                {
                  id: Date.now(),
                  text,
                  date: new Date().toLocaleString("pt-BR"),
                },
              ],
            }
          : item
      )
    );
  }

  function addGanttChatMessage(id, text, author) {
    if (!text.trim()) return;

    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              chatMessages: [
                ...(item.chatMessages || []),
                {
                  id: Date.now(),
                  text,
                  author,
                  createdAt: new Date().toLocaleString("pt-BR"),
                },
              ],
            }
          : item
      )
    );
  }

  function updateGanttStatus(id, newStatus) {
    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );
  }

  function updateGanttItem(id, updatedFields) {
    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item
      )
    );
  }

  function saveGanttDayNote(itemId, dayKey, text) {
    setGanttItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              dayNotes: {
                ...(item.dayNotes || {}),
                [dayKey]: text,
              },
            }
          : item
      )
    );
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

  function addApi(e) {
    e.preventDefault();
    if (!apiForm.name || !apiForm.endpoint) return;

    const newItem = {
      id: Date.now(),
      ...apiForm,
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    setApis([newItem, ...apis]);

    setApiForm({
      name: "",
      endpoint: "",
      method: "GET",
      description: "",
    });
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
  }

  function restoreSelectedTrash() {
    if (selectedTrashIds.length === 0) {
      alert("Selecione ao menos um item da lixeira para restaurar.");
      return;
    }

    const confirmed = window.confirm(
      "Deseja restaurar os itens selecionados?"
    );

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
      urgentPostIts: postIts.filter((item) => getReminderState(item.date) !== "normal").length,
      trash: trash.length,
      chatMessages: ganttItems.reduce(
        (acc, item) => acc + (item.chatMessages || []).length,
        0
      ),
    }),
    [ganttItems, postIts, documents, contracts, apis, trash]
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

        <button style={styles.logoutButton} onClick={handleLogout}>
          Sair
        </button>
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

  function GanttRow({ item, currentUserEmail }) {
    const [commentInput, setCommentInput] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
      title: item.title,
      responsible: item.responsible,
      start: item.start,
      end: item.end,
      status: item.status,
    });

    const [selectedDay, setSelectedDay] = useState("");
    const [selectedDayText, setSelectedDayText] = useState("");

    const startDate = new Date(item.start + "T00:00:00");
    const endDate = new Date(item.end + "T00:00:00");

    const days = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const monthGroups = [];
    let currentMonth = "";
    let currentCount = 0;

    days.forEach((day, index) => {
      const label = monthLabel(day);
      if (label !== currentMonth) {
        if (currentMonth) {
          monthGroups.push({ label: currentMonth, count: currentCount });
        }
        currentMonth = label;
        currentCount = 1;
      } else {
        currentCount += 1;
      }

      if (index === days.length - 1) {
        monthGroups.push({ label: currentMonth, count: currentCount });
      }
    });

    function openDayNote(day) {
      const dayKey = day.toISOString().slice(0, 10);
      setSelectedDay(dayKey);
      setSelectedDayText(item.dayNotes?.[dayKey] || "");
    }

    function saveSelectedDayNote() {
      if (!selectedDay) return;
      saveGanttDayNote(item.id, selectedDay, selectedDayText);
    }

    function saveEdit() {
      if (
        !editForm.title ||
        !editForm.responsible ||
        !editForm.start ||
        !editForm.end
      )
        return;

      updateGanttItem(item.id, editForm);
      setEditing(false);
    }

    function handleSendChatMessage() {
      addGanttChatMessage(item.id, chatInput, currentUserEmail);
      setChatInput("");
    }

    return (
      <div style={styles.demandItem}>
        {!editing ? (
          <div style={styles.demandHeader}>
            <div>
              <strong style={{ fontSize: 18 }}>{item.title}</strong>
              <p style={styles.smallText}>Responsável: {item.responsible}</p>
              <p style={styles.smallText}>
                Início: {formatDateBr(item.start)} | Fim previsto: {formatDateBr(item.end)}
              </p>
            </div>

            <div style={{ minWidth: 220 }}>
              <select
                style={styles.input}
                value={item.status}
                onChange={(e) => updateGanttStatus(item.id, e.target.value)}
              >
                <option>Pendente</option>
                <option>Em andamento</option>
                <option>Concluída</option>
              </select>

              <button
                style={{ ...styles.secondaryButton, width: "100%", marginTop: 8 }}
                onClick={() => setEditing(true)}
              >
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

            <div style={styles.editActions}>
              <button style={styles.secondaryButton} onClick={saveEdit}>
                Salvar alteração
              </button>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    title: item.title,
                    responsible: item.responsible,
                    start: item.start,
                    end: item.end,
                    status: item.status,
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div style={styles.ganttWrapper}>
          <div style={styles.ganttViewport}>
            <div style={styles.ganttInner}>
              <div style={styles.monthRow}>
                {monthGroups.map((group, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.monthCell,
                      width: `${group.count * 42}px`,
                    }}
                  >
                    {group.label}
                  </div>
                ))}
              </div>

              <div style={styles.ganttHeader}>
                {days.map((day, index) => {
                  const dayKey = day.toISOString().slice(0, 10);
                  const hasNote = !!item.dayNotes?.[dayKey];

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => openDayNote(day)}
                      style={{
                        ...styles.ganttDay,
                        ...(isToday(day) ? styles.todayCell : {}),
                        ...(hasNote ? styles.dayWithNote : {}),
                      }}
                      title={hasNote ? item.dayNotes[dayKey] : "Clique para comentar este dia"}
                    >
                      {String(day.getDate()).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              <div style={styles.ganttTrack}>
                {days.map((day, index) => {
                  const dayKey = day.toISOString().slice(0, 10);
                  const hasNote = !!item.dayNotes?.[dayKey];

                  return (
                    <div
                      key={index}
                      style={{
                        ...styles.ganttCell,
                        ...(isToday(day) ? styles.todayTrackCell : {}),
                        ...(hasNote ? styles.ganttCellWithNote : {}),
                      }}
                    >
                      <div
                        style={{
                          ...styles.ganttBar,
                          background: ganttBarColor(item.status),
                          borderRadius:
                            index === 0
                              ? "6px 0 0 6px"
                              : index === days.length - 1
                              ? "0 6px 6px 0"
                              : "0",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {selectedDay && (
          <div style={styles.dayNotePanel}>
            <strong>Observação do dia {formatDateBr(selectedDay)}</strong>

            <textarea
              style={styles.textarea}
              placeholder="Escreva aqui algo importante para esse dia"
              value={selectedDayText}
              onChange={(e) => setSelectedDayText(e.target.value)}
            />

            <div style={styles.editActions}>
              <button style={styles.secondaryButton} onClick={saveSelectedDayNote}>
                Salvar observação
              </button>

              <button
                style={styles.cancelButton}
                onClick={() => {
                  setSelectedDay("");
                  setSelectedDayText("");
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        <div style={styles.chatSection}>
          <h4 style={styles.chatTitle}>Chat da demanda</h4>

          <div style={styles.chatMessages}>
            {(item.chatMessages || []).length === 0 ? (
              <p style={styles.chatEmpty}>Nenhuma mensagem ainda.</p>
            ) : (
              item.chatMessages.map((message) => {
                const isMine = message.author === currentUserEmail;

                return (
                  <div
                    key={message.id}
                    style={{
                      ...styles.chatBubble,
                      ...(isMine ? styles.chatBubbleMine : styles.chatBubbleOther),
                    }}
                  >
                    <div style={styles.chatAuthor}>{message.author}</div>
                    <div style={styles.chatText}>{message.text}</div>
                    <div style={styles.chatDate}>{message.createdAt}</div>
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.chatInputRow}>
            <input
              style={{ ...styles.input, marginBottom: 0 }}
              placeholder="Digite uma mensagem"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />

            <button style={styles.secondaryButton} onClick={handleSendChatMessage}>
              Enviar
            </button>
          </div>
        </div>

        <div style={styles.commentBox}>
          <input
            style={styles.input}
            placeholder="Adicionar comentário geral"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          />

          <button
            style={styles.secondaryButton}
            onClick={() => {
              addGanttComment(item.id, commentInput);
              setCommentInput("");
            }}
          >
            Adicionar comentário
          </button>
        </div>

        {(item.comments || []).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Comentários gerais</strong>
            {(item.comments || []).map((c) => (
              <div key={c.id} style={styles.commentItem}>
                <div>{c.text}</div>
                <div style={styles.commentDate}>{c.date}</div>
              </div>
            ))}
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
          subtitle={`Bem-vindo, ${session.user.email}`}
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
            <h3>Post-its urgentes</h3>
            <p>Total: {dashboardTotals.urgentPostIts}</p>
          </div>

          <div style={styles.card}>
            <h3>Lixeira</h3>
            <p>Total de itens: {dashboardTotals.trash}</p>
          </div>

          <div style={styles.card}>
            <h3>Mensagens no chat</h3>
            <p>Total: {dashboardTotals.chatMessages}</p>
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
          subtitle="Gestão de atividades com cronograma e chat por demanda"
        />

        <div style={styles.moduleLayout}>
          <div style={styles.formCard}>
            <h3>Novo item Gantt</h3>
            <form onSubmit={addGanttItem}>
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

              <label style={styles.label}>Data de início</label>
              <input
                style={styles.input}
                type="date"
                value={ganttForm.start}
                onChange={(e) =>
                  setGanttForm({ ...ganttForm, start: e.target.value })
                }
              />

              <label style={styles.label}>Data prevista para o fim</label>
              <input
                style={styles.input}
                type="date"
                value={ganttForm.end}
                onChange={(e) =>
                  setGanttForm({ ...ganttForm, end: e.target.value })
                }
              />

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

              <textarea
                style={styles.textarea}
                placeholder="Comentário geral inicial"
                value={ganttForm.comment}
                onChange={(e) =>
                  setGanttForm({ ...ganttForm, comment: e.target.value })
                }
              />

              <button style={styles.button} type="submit">
                Salvar item
              </button>
            </form>
          </div>

          <div style={styles.listCard}>
            <SelectionBar
              label="Lista de itens Gantt"
              onDelete={() =>
                moveSelectedToTrash({
                  type: "gantt",
                  sourceItems: ganttItems,
                  selectedIds: selectedGanttIds,
                  setSourceItems: setGanttItems,
                  clearSelection: setSelectedGanttIds,
                })
              }
            />

            {ganttItems.length === 0 ? (
              <p>Nenhum item cadastrado.</p>
            ) : (
              ganttItems.map((item) => (
                <div key={item.id}>
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedGanttIds.includes(item.id)}
                      onChange={() =>
                        toggleSelection(item.id, selectedGanttIds, setSelectedGanttIds)
                      }
                    />
                    <span>Selecionar para exclusão</span>
                  </label>

                  <GanttRow item={item} currentUserEmail={session.user.email} />
                </div>
              ))
            )}
          </div>
        </div>
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

        <div style={styles.moduleLayout}>
          <div style={styles.formCard}>
            <h3>Novo post-it</h3>
            <form onSubmit={addPostIt}>
              <input
                style={styles.input}
                placeholder="Título"
                value={postItForm.title}
                onChange={(e) =>
                  setPostItForm({ ...postItForm, title: e.target.value })
                }
              />

              <textarea
                style={styles.textarea}
                placeholder="Texto do post-it"
                value={postItForm.text}
                onChange={(e) =>
                  setPostItForm({ ...postItForm, text: e.target.value })
                }
              />

              <label style={styles.label}>Data</label>
              <input
                style={styles.input}
                type="date"
                value={postItForm.date}
                onChange={(e) =>
                  setPostItForm({ ...postItForm, date: e.target.value })
                }
              />

              <label style={styles.label}>Criticidade</label>
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

              <label style={styles.label}>Cor do post-it</label>
              <input
                style={styles.colorInput}
                type="color"
                value={postItForm.color}
                onChange={(e) =>
                  setPostItForm({ ...postItForm, color: e.target.value })
                }
              />

              <button style={styles.button} type="submit">
                Salvar post-it
              </button>
            </form>
          </div>

          <div style={styles.listCard}>
            <SelectionBar
              label="Lista de post-its"
              onDelete={() =>
                moveSelectedToTrash({
                  type: "postit",
                  sourceItems: postIts,
                  selectedIds: selectedPostItIds,
                  setSourceItems: setPostIts,
                  clearSelection: setSelectedPostItIds,
                })
              }
            />

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
        </div>
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
          subtitle="Cadastro de integrações e endpoints"
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

              <button style={styles.button} type="submit">
                Salvar API
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
                    {item.payload.title ||
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
        <button style={styles.menuButton} onClick={() => setPage("lixeira")}>
          Lixeira
        </button>
      </div>

      <div style={styles.content}>{renderPage()}</div>
    </div>
  );
}

const styles = {
  centerScreen: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "Arial",
    background: "#eef3f9",
  },
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial",
    background: "#eef3f9",
  },
  leftLogin: {
    flex: 1,
    background: "linear-gradient(135deg, #1e3c72, #2a5298)",
    color: "white",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
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
    background: "white",
    borderRadius: "12px",
    padding: "8px",
  },
  loginHeadline: {
    fontSize: "34px",
    lineHeight: 1.2,
    maxWidth: "520px",
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
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  textarea: {
    display: "block",
    width: "100%",
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    minHeight: "100px",
    resize: "vertical",
  },
  label: {
    display: "block",
    fontSize: "14px",
    marginBottom: "6px",
    color: "#374151",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2a5298",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  cancelButton: {
    padding: "10px 14px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px 14px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  logoutButton: {
    padding: "10px 16px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  dashboard: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial",
    background: "#eef3f9",
  },
  sidebar: {
    width: "260px",
    background: "linear-gradient(180deg, #1e3c72, #2a5298)",
    padding: "24px",
    boxSizing: "border-box",
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
    background: "white",
    borderRadius: "10px",
    padding: "6px",
  },
  menuButton: {
    display: "block",
    width: "100%",
    marginTop: "12px",
    padding: "12px",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
  },
  content: {
    flex: 1,
    padding: "24px",
    boxSizing: "border-box",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "24px",
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
    borderRadius: "10px",
    padding: "6px",
    border: "1px solid #e5e7eb",
  },
  pageTitle: {
    margin: 0,
    fontSize: "28px",
  },
  pageSubtitle: {
    marginTop: "8px",
    color: "#4b5563",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
  },
  moduleLayout: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  formCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    height: "fit-content",
  },
  listCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
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
  demandItem: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "20px",
    marginBottom: "20px",
  },
  demandHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
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
  ganttWrapper: {
    marginTop: "14px",
    paddingBottom: "10px",
    borderBottom: "1px solid #e5e7eb",
  },
  ganttViewport: {
    width: "840px",
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
  },
  ganttInner: {
    width: "max-content",
    minWidth: "840px",
  },
  monthRow: {
    display: "flex",
    minWidth: "fit-content",
    marginBottom: "6px",
  },
  monthCell: {
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dbeafe",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 700,
  },
  ganttHeader: {
    display: "flex",
    minWidth: "fit-content",
  },
  ganttDay: {
    width: "42px",
    minWidth: "42px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "#475569",
    fontWeight: 700,
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    cursor: "pointer",
    padding: 0,
  },
  todayCell: {
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    color: "#92400e",
  },
  dayWithNote: {
    background: "#ede9fe",
    border: "1px solid #8b5cf6",
    color: "#5b21b6",
  },
  ganttTrack: {
    display: "flex",
    minWidth: "fit-content",
  },
  ganttCell: {
    width: "42px",
    minWidth: "42px",
    height: "28px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  todayTrackCell: {
    background: "#fffbeb",
  },
  ganttCellWithNote: {
    boxShadow: "inset 0 0 0 2px #8b5cf6",
  },
  ganttBar: {
    width: "100%",
    height: "100%",
  },
  dayNotePanel: {
    background: "#faf5ff",
    border: "1px solid #d8b4fe",
    borderRadius: "10px",
    padding: "14px",
    marginTop: "14px",
  },
  chatSection: {
    marginTop: "16px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "14px",
  },
  chatTitle: {
    marginTop: 0,
    marginBottom: "12px",
  },
  chatMessages: {
    maxHeight: "260px",
    overflowY: "auto",
    padding: "8px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  chatEmpty: {
    color: "#6b7280",
    margin: 0,
  },
  chatBubble: {
    maxWidth: "80%",
    padding: "10px 12px",
    borderRadius: "12px",
    marginBottom: "10px",
  },
  chatBubbleMine: {
    marginLeft: "auto",
    background: "#dbeafe",
    border: "1px solid #93c5fd",
  },
  chatBubbleOther: {
    marginRight: "auto",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
  },
  chatAuthor: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "4px",
  },
  chatText: {
    fontSize: "14px",
    color: "#111827",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  chatDate: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "6px",
  },
  chatInputRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center",
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
  commentBox: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    marginTop: "14px",
  },
  commentItem: {
    background: "#f8fafc",
    padding: "10px 12px",
    borderRadius: "8px",
    marginTop: "8px",
  },
  commentDate: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
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
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "14px",
    border: "1px solid #e5e7eb",
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
  trashItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "12px",
    background: "#fff",
  },
};