 const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = useMemo(() => {
    let next = [...rows];
    const q = search.toLowerCase().trim();
    if (q) {
      next = next.filter((r) => r.leadEmail.toLowerCase().includes(q) || r.quoteId.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") next = next.filter((r) => r.status === statusFilter);
    return next;
  }, [rows, search, statusFilter]);

  function updateRowLocal(quoteId: string, updater: (row: PipelineRow) => PipelineRow) {
    setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? updater(r) : r)));
  }

  async function generatePie(quoteId: string) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    setMessageByQuote((m) => ({ ...m, [quoteId]: "Analyzing lead with AI..." }));

    try {
      const res = await fetch("/api/internal/pie/generate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId, force: true }),
      });
      if (!res.ok) throw new Error("Failed to generate PIE");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to generate PIE");
      setMessageByQuote((m) => ({ ...m, [quoteId]: "PIE Generated! Refreshing..." }));
      router.refresh(); 
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err.message || "Failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }

  async function saveQuoteAdmin(quoteId: string, payload: any) {
    setBusyByQuote((m) => ({ ...m, [quoteId]: true }));
    try {
      const res = await fetch("/api/internal/admin/quote-admin", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId, ...payload }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setRows((prev) => prev.map((r) => (r.quoteId === quoteId ? { ...r, ...payload } : r)));
      setMessageByQuote((m) => ({ ...m, [quoteId]: "Saved successfully." }));
    } catch (err: any) {
      setMessageByQuote((m) => ({ ...m, [quoteId]: err?.message || "Save failed" }));
    } finally {
      setBusyByQuote((m) => ({ ...m, [quoteId]: false }));
    }
  }
