import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";

function Question({ text, value, onChange }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "5px",
          fontWeight: "bold",
        }}
      >
        {text}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
        }}
      >
        <option value="">Select Response</option>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
        <option value="N/A">N/A</option>
      </select>
    </div>
  );
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <label
        style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
      >
        Inspector Signature
      </label>
      <canvas
        ref={canvasRef}
        width={460}
        height={150}
        style={{
          border: "1px solid #999",
          borderRadius: "4px",
          touchAction: "none",
          background: "#fff",
          width: "100%",
          maxWidth: "460px",
          height: "150px",
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <br />
      <button
        type="button"
        onClick={clearCanvas}
        style={{
          marginTop: "5px",
          padding: "6px 12px",
          backgroundColor: "#ddd",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Clear Signature
      </button>
    </div>
  );
}

// Normalizes any form (old flat "questions" array OR new "items" array)
// into the { name, items: [{type, text}] } shape used everywhere in the app.
function normalizeForm(form) {
  if (!form) return { name: "", items: [] };
  if (form.items) return form;
  const items = (form.questions || []).map((q) => ({ type: "question", text: q }));
  return { name: form.name, items };
}

// Built-in forms that ship with the app.
// form1/2/3 use the new "items" structure (question | section | text).
// prejob keeps its own flat "questions" array since it has a dedicated
// PDF layout with a Control Measures column that doesn't need sections.
const DEFAULT_FORMS = {
  form1: {
    name: "Type 1",
    items: [
      { type: "question", text: "Question 1" },
      { type: "question", text: "Question 2" },
      { type: "question", text: "Question 3" },
    ],
  },
  form2: {
    name: "Type 2",
    items: [
      { type: "question", text: "Question 1" },
      { type: "question", text: "Question 2" },
      { type: "question", text: "Question 3" },
      { type: "question", text: "Question 4" },
    ],
  },
  form3: {
    name: "Type 3",
    items: [
      { type: "question", text: "Question 1" },
      { type: "question", text: "Question 2" },
    ],
  },
  prejob: {
    name: "Pre-Job Task Hazard Analysis",
    questions: [
      "Are there any conflicting jobs in the vicinity of the task at hand? (Communication made?)",
      "Are personnel required to work in the vicinity of mobile equipment?",
      "Tools and equipment inspected prior to use?",
      "All defective tools and equipment will be tagged and locked out?",
      "Can personnel come in contact/be exposed to any energy source or hazardous material?",
      "Can personnel be struck by protruding, stationary or moving objects or sharp edges?",
      "Can personnel be caught in or between anything?",
      "Can personnel slip, trip, or fall to the same level or to the area below?",
      "Is there a possibility of overexertion or strain by lifting, pulling, pushing or twisting?",
      "Have all locations that pertain to the job been reviewed?",
      "Are there fire hazards associated with the task? (Secondary locations-dump sites, assembly points, permit area)",
      "MSDS available for WHMIS Controlled products?",
      "Are there environmental controls/procedures necessary for spills/emissions/waste?",
      "Are there any environmental aspects that need to be reviewed or assessed?",
      "Is a rescue or environmental response plan required? (List team and verify training)",
      "Additional Personal Protective Equipment?",
      "Journey Management Requirements?",
    ],
  },
};

function App() {
  const [site, setSite] = useState("");
  const [comments, setComments] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [answers, setAnswers] = useState({});
  const [inspectorName, setInspectorName] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [signature, setSignature] = useState("");
  const [status, setStatus] = useState("");
  const [photos, setPhotos] = useState([]);

  const [submittedForms, setSubmittedForms] = useState(() => {
    const saved = localStorage.getItem("submittedForms");
    return saved ? JSON.parse(saved) : [];
  });

  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState(() => {
    const saved = localStorage.getItem("syncQueue");
    return saved ? JSON.parse(saved) : [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // "new" | "submitted" | "builder"
  const [activeTab, setActiveTab] = useState("new");

  // ---- Custom, user-created forms (persisted) ----
  const [customForms, setCustomForms] = useState(() => {
    const saved = localStorage.getItem("customForms");
    return saved ? JSON.parse(saved) : {};
  });

  // ---- Form Builder working state ----
  const [builderName, setBuilderName] = useState("");
  const [builderItems, setBuilderItems] = useState([]); // [{ type: "question"|"section"|"text", text }]
  const [builderItemInput, setBuilderItemInput] = useState("");
  const [builderItemType, setBuilderItemType] = useState("question");
  const [editingFormId, setEditingFormId] = useState(null); // id of custom form being edited, if any

  const formRef = useRef(null);

  // Merge built-in + custom forms into one lookup, normalized to { name, items }
  const allForms = {};
  Object.keys(DEFAULT_FORMS).forEach((key) => {
    allForms[key] = normalizeForm(DEFAULT_FORMS[key]);
  });
  Object.keys(customForms).forEach((key) => {
    allForms[key] = normalizeForm(customForms[key]);
  });

  const preJobControls = {
    "Are there any conflicting jobs in the vicinity of the task at hand? (Communication made?)":
      "Good verbal communication, coordinate tasks with other trades, sign onto each other's FLRA's. Update FLRA throughout the day.",
    "Are personnel required to work in the vicinity of mobile equipment?":
      "Good communication/eye contact with the operator, keep clear of overhead loads.",
    "Tools and equipment inspected prior to use?":
      "Inspect tools before use, document all equipment inspections.",
    "All defective tools and equipment will be tagged and locked out?":
      "Proper lockout procedures, tag out and document all defective tools.",
    "Can personnel come in contact/be exposed to any energy source or hazardous material?":
      "Check cords and ground prongs, use GFCI receptacles.",
    "Can personnel be struck by protruding, stationary or moving objects or sharp edges?":
      "Assess work area, good path, be aware of line of fire.",
    "Can personnel be caught in or between anything?":
      "Good hand and body placement, watch for pinch points, awareness of surroundings.",
    "Can personnel slip, trip, or fall to the same level or to the area below?":
      "Good footing, 100% tie off above 6 feet, use the right ladder for the task, strap ladders.",
    "Is there a possibility of overexertion or strain by lifting, pulling, pushing or twisting?":
      "Stretch and flex, take micro-breaks, 45lb max lift, get help/give help.",
    "Have all locations that pertain to the job been reviewed?":
      "Muster behind WWTP at sign, first aid located at medic truck or tool trailer.",
    "Are there fire hazards associated with the task? (Secondary locations-dump sites, assembly points, permit area)":
      "Know the location of extinguishers in your area. Extinguishers at exits, and at/in equipment.",
    "MSDS available for WHMIS Controlled products?":
      "MSDS available online. Know your product before use.",
    "Are there environmental controls/procedures necessary for spills/emissions/waste?":
      "Spill kits available in sea-can, trucks, equipment, and site office. Proper reporting, clean-up, and documentation.",
    "Are there any environmental aspects that need to be reviewed or assessed?":
      "Changing site and weather conditions.",
    "Is a rescue or environmental response plan required? (List team and verify training)":
      "ERP is located in site office.",
    "Additional Personal Protective Equipment?":
      "All basic all the time, all task specific.",
    "Journey Management Requirements?":
      "No cell phone use while operating mobile equipment and operation of motor vehicle.",
  };

  const handleAnswerChange = (question, value) => {
    setAnswers(function (prev) {
      const updated = Object.assign({}, prev);
      updated[question] = value;
      return updated;
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ---------- Form Builder handlers ----------
  const addBuilderItem = () => {
    const val = builderItemInput.trim();
    if (!val) return;
    setBuilderItems((prev) => [...prev, { type: builderItemType, text: val }]);
    setBuilderItemInput("");
  };

  const removeBuilderItem = (index) => {
    setBuilderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBuilderItem = (index, direction) => {
    setBuilderItems((prev) => {
      const updated = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= updated.length) return updated;
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
  };

  const resetBuilder = () => {
    setBuilderName("");
    setBuilderItems([]);
    setBuilderItemInput("");
    setBuilderItemType("question");
    setEditingFormId(null);
  };

  const saveCustomForm = () => {
    const name = builderName.trim();
    if (!name) {
      alert("Please give your form a name.");
      return;
    }
    if (builderItems.length === 0) {
      alert("Please add at least one question, section, or text item.");
      return;
    }

    const id = editingFormId || `custom_${Date.now()}`;
    const updated = {
      ...customForms,
      [id]: { name, items: [...builderItems] },
    };
    setCustomForms(updated);
    localStorage.setItem("customForms", JSON.stringify(updated));
    alert(`Form "${name}" saved! It now appears in the Inspection Type dropdown.`);
    resetBuilder();
  };

  const editCustomForm = (id) => {
    const form = customForms[id];
    if (!form) return;
    const normalized = normalizeForm(form);
    setBuilderName(normalized.name);
    setBuilderItems([...normalized.items]);
    setEditingFormId(id);
  };

  const deleteCustomForm = (id) => {
    if (!window.confirm("Delete this form? This cannot be undone.")) return;
    const updated = { ...customForms };
    delete updated[id];
    setCustomForms(updated);
    localStorage.setItem("customForms", JSON.stringify(updated));
    if (inspectionType === id) setInspectionType("");
    if (editingFormId === id) resetBuilder();
  };

  const addPhotosToPDF = (pdf, pageWidth, pageHeight, margin, startY, photoList) => {
    let y = startY;
    if (!photoList || photoList.length === 0) return y;

    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont(undefined, "bold");
    pdf.text("Photos", margin, y);
    pdf.setFont(undefined, "normal");
    y += 8;

    const imgSize = 50;
    let xPos = margin;

    photoList.forEach((photo) => {
      if (xPos + imgSize > pageWidth - margin) {
        xPos = margin;
        y += imgSize + 5;
      }
      if (y + imgSize > pageHeight - margin) {
        pdf.addPage();
        y = margin;
        xPos = margin;
      }
      pdf.addImage(photo, "JPEG", xPos, y, imgSize, imgSize);
      xPos += imgSize + 5;
    });

    y += imgSize + 10;
    return y;
  };

  const generatePreJobPDF = (data) => {
    const d = data || {
      site,
      inspectionDate,
      answers,
      comments,
      photos,
      signature,
      inspectorName,
    };

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;

    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.text("Pre-Job Task Hazard Analysis", pageWidth / 2, y, {
      align: "center",
    });
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    pdf.text(`Location: ${d.site || "-"}`, margin, y);
    pdf.text(`Date: ${d.inspectionDate || "-"}`, pageWidth - margin - 50, y);
    y += 8;

    const col1X = margin;
    const col1W = 65;
    const col2X = col1X + col1W;
    const col2W = 12;
    const col3X = col2X + col2W;
    const col3W = 12;
    const col4X = col3X + col3W;
    const col4W = pageWidth - margin - col4X;

    const drawHeaderRow = () => {
      pdf.setFillColor(0, 120, 212);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(col1X, y, col1W, 8, "F");
      pdf.rect(col2X, y, col2W, 8, "F");
      pdf.rect(col3X, y, col3W, 8, "F");
      pdf.rect(col4X, y, col4W, 8, "F");
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(9);
      pdf.text("Hazard / Question", col1X + 2, y + 5.5);
      pdf.text("Yes", col2X + 3, y + 5.5);
      pdf.text("No", col3X + 3, y + 5.5);
      pdf.text("Control Measures", col4X + 2, y + 5.5);
      y += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
    };

    drawHeaderRow();

    DEFAULT_FORMS.prejob.questions.forEach((question) => {
      const answer = d.answers[question] || "";
      const control = preJobControls[question] || "";

      const questionLines = pdf.splitTextToSize(question, col1W - 4);
      const controlLines = pdf.splitTextToSize(control, col4W - 4);
      const rowLines = Math.max(questionLines.length, controlLines.length, 1);
      const rowHeight = rowLines * 5 + 3;

      if (y + rowHeight > pageHeight - margin - 15) {
        pdf.addPage();
        y = margin;
        drawHeaderRow();
      }

      pdf.rect(col1X, y, col1W, rowHeight);
      pdf.rect(col2X, y, col2W, rowHeight);
      pdf.rect(col3X, y, col3W, rowHeight);
      pdf.rect(col4X, y, col4W, rowHeight);

      pdf.setFontSize(9);
      pdf.text(questionLines, col1X + 2, y + 5);
      pdf.text(answer === "Yes" ? "X" : "", col2X + 6, y + 5);
      pdf.text(answer === "No" ? "X" : "", col3X + 6, y + 5);
      pdf.text(controlLines, col4X + 2, y + 5);

      y += rowHeight;
    });

    y += 8;
    if (y > pageHeight - 50) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont(undefined, "bold");
    pdf.setFontSize(9);
    pdf.text("HSE IS EVERYONE'S RESPONSIBILITY:", margin, y);
    pdf.setFont(undefined, "normal");
    y += 5;
    const hseText = pdf.splitTextToSize(
      "All workers have the obligation to refuse unsafe work or work they are not capable of performing. The job MUST STOP if it becomes unsafe at any time. If the job scope changes, there is a need to re-evaluate. Health, Safety and Environmental performance will not be compromised.",
      pageWidth - margin * 2
    );
    pdf.text(hseText, margin, y);
    y += hseText.length * 4 + 8;

    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont(undefined, "bold");
    pdf.text("Additional Comments:", margin, y);
    pdf.setFont(undefined, "normal");
    y += 5;
    const commentLines = pdf.splitTextToSize(d.comments || "-", pageWidth - margin * 2);
    pdf.text(commentLines, margin, y);
    y += commentLines.length * 5 + 10;

    y = addPhotosToPDF(pdf, pageWidth, pageHeight, margin, y, d.photos);

    if (y > pageHeight - 20) {
      pdf.addPage();
      y = margin;
    }

    if (d.signature) {
      pdf.addImage(d.signature, "PNG", margin, y - 15, 60, 18);
    }
    pdf.line(margin, y, margin + 70, y);
    pdf.setFontSize(8);
    pdf.text("Inspector Signature", margin, y + 5);

    pdf.line(margin + 90, y, margin + 150, y);
    pdf.text(d.inspectorName || "", margin + 90, y - 2);
    pdf.text("Inspector Name", margin + 90, y + 5);

    pdf.save("Pre-Job-Task-Hazard-Analysis.pdf");
  };

  const generateGenericPDF = (data) => {
    const d = data || {
      site,
      inspectionType,
      status,
      inspectorName,
      inspectionDate,
      comments,
      answers,
      photos,
      signature,
    };

    const formMeta = allForms[d.inspectionType];
    const formLabel = formMeta ? formMeta.name : d.inspectionType || "-";
    const items = (formMeta && formMeta.items) || [];

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let y = margin;

    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.text(formLabel, pageWidth / 2, y, { align: "center" });
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    pdf.text(`Site: ${d.site || "-"}`, margin, y);
    pdf.text(`Date: ${d.inspectionDate || "-"}`, pageWidth - margin - 50, y);
    y += 6;
    pdf.text(`Status: ${d.status || "-"}`, margin, y);
    pdf.text(`Inspector: ${d.inspectorName || "-"}`, pageWidth - margin - 50, y);
    y += 8;

    // Boxed 3-column table: Question | Yes | No (no control measures)
    const col1X = margin;
    const col1W = pageWidth - margin * 2 - 30; // remaining width minus Yes/No cols
    const col2X = col1X + col1W;
    const col2W = 15;
    const col3X = col2X + col2W;
    const col3W = 15;

    const drawHeaderRow = () => {
      pdf.setFillColor(0, 120, 212);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(col1X, y, col1W, 8, "F");
      pdf.rect(col2X, y, col2W, 8, "F");
      pdf.rect(col3X, y, col3W, 8, "F");
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(9);
      pdf.text("Question", col1X + 2, y + 5.5);
      pdf.text("Yes", col2X + 3, y + 5.5);
      pdf.text("No", col3X + 3, y + 5.5);
      y += 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
    };

    drawHeaderRow();

    const fullTableW = col1W + col2W + col3W;

    items.forEach((item) => {
      // ---- Section header: full-width orange bar ----
      if (item.type === "section") {
        const rowH = 8;
        if (y + rowH > pageHeight - margin - 15) {
          pdf.addPage();
          y = margin;
          drawHeaderRow();
        }
        pdf.setFillColor(245, 130, 32);
        pdf.rect(col1X, y, fullTableW, rowH, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, "bold");
        pdf.setFontSize(10);
        pdf.text(item.text, col1X + 3, y + 5.5);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, "normal");
        y += rowH;
        return;
      }

      // ---- Info text: full-width italic note ----
      if (item.type === "text") {
        const lines = pdf.splitTextToSize(item.text, fullTableW - 4);
        const rowH = lines.length * 5 + 4;
        if (y + rowH > pageHeight - margin - 15) {
          pdf.addPage();
          y = margin;
          drawHeaderRow();
        }
        pdf.setFontSize(9);
        pdf.setFont(undefined, "italic");
        pdf.setTextColor(90, 90, 90);
        pdf.text(lines, col1X + 2, y + 5);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, "normal");
        y += rowH;
        return;
      }

      // ---- Question row (Question | Yes | No) ----
      const question = item.text;
      const answer = d.answers[question] || "";

      const questionLines = pdf.splitTextToSize(question, col1W - 4);
      const rowHeight = questionLines.length * 5 + 3;

      if (y + rowHeight > pageHeight - margin - 15) {
        pdf.addPage();
        y = margin;
        drawHeaderRow();
      }

      pdf.rect(col1X, y, col1W, rowHeight);
      pdf.rect(col2X, y, col2W, rowHeight);
      pdf.rect(col3X, y, col3W, rowHeight);

      pdf.setFontSize(9);
      pdf.text(questionLines, col1X + 2, y + 5);
      pdf.text(answer === "Yes" ? "X" : "", col2X + 6, y + 5);
      pdf.text(answer === "No" ? "X" : "", col3X + 6, y + 5);

      y += rowHeight;
    });

    y += 8;
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont(undefined, "bold");
    pdf.setFontSize(10);
    pdf.text("Comments", margin, y);
    pdf.setFont(undefined, "normal");
    y += 5;
    const splitComments = pdf.splitTextToSize(d.comments || "-", pageWidth - margin * 2);
    pdf.text(splitComments, margin, y);
    y += splitComments.length * 5 + 10;

    y = addPhotosToPDF(pdf, pageWidth, pageHeight, margin, y, d.photos);

    if (y > pageHeight - 20) {
      pdf.addPage();
      y = margin;
    }

    if (d.signature) {
      pdf.addImage(d.signature, "PNG", margin, y - 15, 60, 18);
    }
    pdf.line(margin, y, margin + 70, y);
    pdf.setFontSize(8);
    pdf.text("Inspector Signature", margin, y + 5);

    pdf.line(margin + 90, y, margin + 150, y);
    pdf.text(d.inspectorName || "", margin + 90, y - 2);
    pdf.text("Inspector Name", margin + 90, y + 5);

    pdf.save(`Inspection-${formLabel.replace(/\s+/g, "-")}.pdf`);
  };

  const handleDownloadPDF = (record) => {
    const type = record ? record.inspectionType : inspectionType;
    if (type === "prejob") {
      generatePreJobPDF(record);
    } else {
      generateGenericPDF(record);
    }
  };

  const handleSubmit = () => {
    if (!inspectionType) {
      alert("Please select an inspection type before submitting.");
      return;
    }

    const record = {
      id: Date.now(),
      site,
      inspectionType,
      status,
      inspectorName,
      inspectionDate,
      comments,
      answers: { ...answers },
      photos: [...photos],
      signature,
    };

    if (isOnline) {
      const updated = [{ ...record, syncStatus: "Synced" }, ...submittedForms];
      setSubmittedForms(updated);
      localStorage.setItem("submittedForms", JSON.stringify(updated));
      alert("Inspection submitted and synced!");
    } else {
      const updatedQueue = [record, ...syncQueue];
      setSyncQueue(updatedQueue);
      localStorage.setItem("syncQueue", JSON.stringify(updatedQueue));
      alert(
        "No connection detected. Inspection saved locally and will sync automatically once you're back online."
      );
    }
  };

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      setIsSyncing(true);

      const timer = setTimeout(() => {
        const syncedRecords = syncQueue.map((r) => ({
          ...r,
          syncStatus: "Synced",
        }));

        const updatedSubmitted = [...syncedRecords, ...submittedForms];
        setSubmittedForms(updatedSubmitted);
        localStorage.setItem("submittedForms", JSON.stringify(updatedSubmitted));

        setSyncQueue([]);
        localStorage.setItem("syncQueue", JSON.stringify([]));
        setIsSyncing(false);
      }, 1800);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const isCustomForm = (id) => Object.prototype.hasOwnProperty.call(customForms, id);

  return (
    <div
      ref={formRef}
      style={{
        maxWidth: "500px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial",
      }}
    >
      {/* Connection Status Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: "6px",
          marginBottom: "15px",
          backgroundColor: isOnline ? "#e6f4ea" : "#fdecea",
          border: `1px solid ${isOnline ? "#34a853" : "#d93025"}`,
        }}
      >
        <span
          style={{
            fontWeight: "bold",
            color: isOnline ? "#1e7e34" : "#a12622",
          }}
        >
          {isSyncing
            ? "🔄 Syncing pending forms..."
            : isOnline
            ? "📶 Online"
            : `⚠️ Offline${
                syncQueue.length > 0 ? ` — ${syncQueue.length} form(s) pending sync` : ""
              }`}
        </span>

        <button
          onClick={() => setIsOnline((prev) => !prev)}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            backgroundColor: isOnline ? "#d93025" : "#34a853",
            color: "white",
            fontSize: "12px",
          }}
        >
          {isOnline ? "Simulate Offline" : "Go Online"}
        </button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          marginBottom: "20px",
          borderBottom: "2px solid #eee",
        }}
      >
        <button
          onClick={() => setActiveTab("new")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            borderBottom:
              activeTab === "new" ? "3px solid #0078D4" : "3px solid transparent",
            backgroundColor: "transparent",
            fontWeight: activeTab === "new" ? "bold" : "normal",
            color: activeTab === "new" ? "#0078D4" : "#666",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          New Inspection
        </button>

        <button
          onClick={() => setActiveTab("submitted")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            borderBottom:
              activeTab === "submitted" ? "3px solid #0078D4" : "3px solid transparent",
            backgroundColor: "transparent",
            fontWeight: activeTab === "submitted" ? "bold" : "normal",
            color: activeTab === "submitted" ? "#0078D4" : "#666",
            cursor: "pointer",
            fontSize: "14px",
            position: "relative",
          }}
        >
          Submitted
          {(submittedForms.length > 0 || syncQueue.length > 0) && (
            <span
              style={{
                marginLeft: "6px",
                backgroundColor: "#28a745",
                color: "white",
                borderRadius: "10px",
                padding: "1px 7px",
                fontSize: "11px",
              }}
            >
              {submittedForms.length + syncQueue.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          style={{
            flex: 1,
            padding: "10px",
            border: "none",
            borderBottom:
              activeTab === "builder" ? "3px solid #0078D4" : "3px solid transparent",
            backgroundColor: "transparent",
            fontWeight: activeTab === "builder" ? "bold" : "normal",
            color: activeTab === "builder" ? "#0078D4" : "#666",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Manage Forms
        </button>
      </div>

      {/* ---------------- NEW INSPECTION TAB ---------------- */}
      {activeTab === "new" && (
        <>
          <h1
            style={{
              fontSize: "36px",
              textAlign: "center",
              color: "#0078D4",
            }}
          >
            Form Management App
          </h1>

          <h2>New Inspection</h2>

          <input
            type="text"
            placeholder="Site"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />

          <select
            value={inspectionType}
            onChange={(e) => {
              setInspectionType(e.target.value);
              setAnswers({});
            }}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          >
            <option value="">Select Inspection Type</option>
            {Object.keys(allForms).map((key) => (
              <option key={key} value={key}>
                {allForms[key].name}
              </option>
            ))}
          </select>

          <h3 style={{ color: "#F58220", fontWeight: "bold" }}>Checklist</h3>

          {inspectionType &&
            allForms[inspectionType]?.items.map((item, idx) => {
              if (item.type === "section") {
                return (
                  <h4
                    key={`section-${idx}`}
                    style={{
                      color: "#0078D4",
                      marginTop: "20px",
                      marginBottom: "10px",
                      borderBottom: "2px solid #0078D4",
                      paddingBottom: "4px",
                    }}
                  >
                    {item.text}
                  </h4>
                );
              }

              if (item.type === "text") {
                return (
                  <p
                    key={`text-${idx}`}
                    style={{
                      color: "#555",
                      fontStyle: "italic",
                      fontSize: "13px",
                      marginBottom: "12px",
                    }}
                  >
                    {item.text}
                  </p>
                );
              }

              return (
                <Question
                  key={`question-${idx}`}
                  text={item.text}
                  value={answers[item.text] || ""}
                  onChange={(value) => handleAnswerChange(item.text, value)}
                />
              );
            })}

          <h4>COMMENTS</h4>
          <textarea
            placeholder="Comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            style={{ width: "100%", height: "100px", padding: "10px" }}
          />

          <h3>Attachments</h3>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            {photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Photo ${index + 1}`}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  border: "1px solid #ccc",
                }}
              />
            ))}
          </div>

          <br />

          <input
            type="text"
            placeholder="Inspector Name"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          >
            <option value="">Select Inspection Status</option>
            <option value="Pass">Pass</option>
            <option value="Pass with Notes">Pass with Notes</option>
            <option value="Fail">Fail</option>
          </select>

          <input
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />

          <SignaturePad value={signature} onChange={setSignature} />

          <br />

          <button
            onClick={handleSubmit}
            style={{
              padding: "10px 20px",
              backgroundColor: "#0078D4",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            Submit Inspection
          </button>

          <button
            onClick={() => handleDownloadPDF()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              marginLeft: "10px",
            }}
          >
            Download PDF
          </button>

          <hr />

          <h3>Review</h3>
          <p><strong>Site:</strong> {site}</p>
          <p>
            <strong>Inspection Type:</strong>{" "}
            {allForms[inspectionType]?.name || inspectionType}
          </p>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Inspector:</strong> {inspectorName}</p>
          <p><strong>Date:</strong> {inspectionDate}</p>
          <p><strong>Comments:</strong> {comments}</p>
        </>
      )}

      {/* ---------------- SUBMITTED FORMS TAB ---------------- */}
      {activeTab === "submitted" && (
        <>
          <h1
            style={{
              fontSize: "28px",
              textAlign: "center",
              color: "#0078D4",
            }}
          >
            Submitted Forms
          </h1>

          {syncQueue.length > 0 && (
            <>
              <h3 style={{ color: "#d93025" }}>Pending Sync ({syncQueue.length})</h3>
              {syncQueue.map((record) => (
                <div
                  key={record.id}
                  style={{
                    border: "1px dashed #d93025",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "10px",
                    backgroundColor: "#fff8f7",
                  }}
                >
                  <p style={{ margin: "2px 0" }}>
                    <strong>Site:</strong> {record.site || "-"}
                  </p>
                  <p style={{ margin: "2px 0" }}>
                    <strong>Type:</strong>{" "}
                    {allForms[record.inspectionType]?.name || record.inspectionType}
                  </p>
                  <p style={{ margin: "2px 0", color: "#d93025", fontWeight: "bold" }}>
                    Waiting for connection...
                  </p>
                </div>
              ))}
              <hr />
            </>
          )}

          <h3 style={{ color: "#0078D4" }}>Submitted</h3>

          {submittedForms.length === 0 && (
            <p style={{ color: "#666" }}>No forms submitted yet.</p>
          )}

          {submittedForms.map((record) => (
            <div
              key={record.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
                backgroundColor: "#fafafa",
              }}
            >
              <p style={{ margin: "2px 0" }}>
                <strong>Site:</strong> {record.site || "-"}
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Type:</strong>{" "}
                {allForms[record.inspectionType]?.name || record.inspectionType}
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Status:</strong> {record.status || "-"}
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Date:</strong> {record.inspectionDate || "-"}
              </p>
              <p style={{ margin: "2px 0", color: "#1e7e34", fontSize: "12px" }}>
                ✅ {record.syncStatus || "Synced"}
              </p>
              <button
                onClick={() => handleDownloadPDF(record)}
                style={{
                  marginTop: "8px",
                  padding: "6px 14px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Download PDF
              </button>
            </div>
          ))}
        </>
      )}

      {/* ---------------- FORM BUILDER TAB ---------------- */}
      {activeTab === "builder" && (
        <>
          <h1
            style={{
              fontSize: "28px",
              textAlign: "center",
              color: "#0078D4",
            }}
          >
            Manage Forms
          </h1>

          <h3 style={{ color: "#F58220" }}>
            {editingFormId ? "Edit Form" : "Create New Form"}
          </h3>

          <input
            type="text"
            placeholder="Form Name (e.g. Vehicle Inspection)"
            value={builderName}
            onChange={(e) => setBuilderName(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
          />

          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#666",
              marginBottom: "6px",
            }}
          >
            Add Item Type:
          </label>

          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            {["question", "section", "text"].map((t) => (
              <button
                key={t}
                onClick={() => setBuilderItemType(t)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "4px",
                  border:
                    builderItemType === t ? "2px solid #0078D4" : "1px solid #ccc",
                  backgroundColor: builderItemType === t ? "#E6F2FB" : "white",
                  color: builderItemType === t ? "#0078D4" : "#333",
                  fontWeight: builderItemType === t ? "bold" : "normal",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {t === "section"
                  ? "📁 Section Header"
                  : t === "text"
                  ? "📝 Info Text"
                  : "❓ Question"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder={
                builderItemType === "section"
                  ? "Section title (e.g. Exterior Inspection)"
                  : builderItemType === "text"
                  ? "Instructional text to display (e.g. Complete before starting work)"
                  : "Type a question and click Add"
              }
              value={builderItemInput}
              onChange={(e) => setBuilderItemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBuilderItem();
                }
              }}
              style={{ flex: 1, padding: "10px" }}
            />
            <button
              onClick={addBuilderItem}
              style={{
                padding: "10px 16px",
                backgroundColor: "#0078D4",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>

          {builderItems.length === 0 && (
            <p style={{ color: "#666", fontSize: "13px" }}>
              No items added yet.
            </p>
          )}

          {builderItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #ddd",
                borderLeft:
                  item.type === "section"
                    ? "4px solid #F58220"
                    : item.type === "text"
                    ? "4px solid #8FA6C9"
                    : "4px solid #0078D4",
                borderRadius: "6px",
                padding: "8px 10px",
                marginBottom: "6px",
                backgroundColor:
                  item.type === "section"
                    ? "#FFF4E9"
                    : item.type === "text"
                    ? "#F3F6FA"
                    : "#fafafa",
              }}
            >
              <span style={{ fontSize: "13px" }}>
                {item.type === "section" && <strong>📁 {item.text}</strong>}
                {item.type === "text" && <em>📝 {item.text}</em>}
                {item.type === "question" && `${index + 1}. ${item.text}`}
              </span>
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                <button
                  onClick={() => moveBuilderItem(index, -1)}
                  disabled={index === 0}
                  style={{
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#ddd",
                    cursor: index === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveBuilderItem(index, 1)}
                  disabled={index === builderItems.length - 1}
                  style={{
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#ddd",
                    cursor:
                      index === builderItems.length - 1
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => removeBuilderItem(index)}
                  style={{
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "#d93025",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "15px" }}>
            <button
              onClick={saveCustomForm}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              {editingFormId ? "Save Changes" : "Save New Form"}
            </button>

            {(editingFormId || builderName || builderItems.length > 0) && (
              <button
                onClick={resetBuilder}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ddd",
                  color: "#333",
                  border: "none",
                  borderRadius: "5px",
                  marginLeft: "10px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <hr />

          <h3 style={{ color: "#0078D4" }}>Your Custom Forms</h3>

          {Object.keys(customForms).length === 0 && (
            <p style={{ color: "#666", fontSize: "13px" }}>
              No custom forms created yet.
            </p>
          )}

          {Object.keys(customForms).map((id) => {
            const normalized = normalizeForm(customForms[id]);
            const qCount = normalized.items.filter((i) => i.type === "question").length;
            const sCount = normalized.items.filter((i) => i.type === "section").length;
            return (
            <div
              key={id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "10px",
                backgroundColor: "#fafafa",
              }}
            >
              <p style={{ margin: "2px 0", fontWeight: "bold" }}>
                {normalized.name}
              </p>
              <p style={{ margin: "2px 0", fontSize: "12px", color: "#666" }}>
                {qCount} question(s){sCount > 0 ? `, ${sCount} section(s)` : ""}
              </p>
              <div style={{ marginTop: "8px" }}>
                <button
                  onClick={() => editCustomForm(id)}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "#0078D4",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "8px",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteCustomForm(id)}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: "#d93025",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            );
          })}

          <p style={{ color: "#999", fontSize: "11px", marginTop: "15px" }}>
            Built-in forms (Type 1, Type 2, Type 3, Pre-Job Task Hazard Analysis)
            are provided by default and cannot be deleted here.
          </p>
        </>
      )}
    </div>
  );
}

export default App;
