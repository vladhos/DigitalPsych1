import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertCircle, Upload, CheckCircle2, Play, BookOpen, Trash2, PencilRuler } from 'lucide-react';
import { AssessmentBuilder } from './builder/AssessmentBuilder';

export default function AdminSettings() {
    const [jsonInput, setJsonInput] = useState<string>(`{
  "template_metadata": {
    "name": "BFI-2: The Big Five Inventory-2",
    "version": "1.0",
    "description": "Komplexný osobnostný dotazník merajúci 5 hlavných domén a 15 facetov osobnosti.",
    "author": "Christopher J. Soto & Oliver P. John; Slovenská adaptácia: P. Halama & M. Kohút"
  },
  "scoring_logic": {
    "scale": "1-5",
    "reverse_items": [
      "3", "4", "5", "8", "9", "11", "12", "16", "17", "22", "23", "24", "25", "26", "28", "29", "30", "31", "33", "36", "37", "42", "44", "45", "47", "48", "49", "50", "51", "55", "58"
    ],
    "dimensions": {
      "Extraverzia": ["1", "6", "11", "16", "21", "26", "31", "36", "41", "46", "51", "56"],
      "Prívetivosť": ["2", "7", "12", "17", "22", "27", "32", "37", "42", "47", "52", "57"],
      "Svedomitosť": ["3", "8", "13", "18", "23", "28", "33", "38", "43", "48", "53", "58"],
      "Negatívna emocionalita": ["4", "9", "14", "19", "24", "29", "34", "39", "44", "49", "54", "59"],
      "Otvorenosť": ["5", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55", "60"],
      
      "F_Sociabilita": ["1", "16", "31", "46"],
      "F_Asertivita": ["6", "21", "36", "51"],
      "F_Energetická úroveň": ["11", "26", "41", "56"],
      "F_Súcit": ["2", "17", "32", "47"],
      "F_Zdvorilosť": ["7", "22", "37", "52"],
      "F_Dôvera": ["12", "27", "42", "57"],
      "F_Organizovanosť": ["3", "18", "33", "48"],
      "F_Produktivita": ["8", "23", "38", "53"],
      "F_Zodpovednosť": ["13", "28", "43", "58"],
      "F_Úzkosť": ["4", "19", "34", "49"],
      "F_Depresia": ["9", "24", "39", "54"],
      "F_Emocionálna nestálosť": ["14", "29", "44", "59"],
      "F_Intelektuálna zvedavosť": ["10", "25", "40", "55"],
      "F_Estetická senzitivita": ["5", "20", "35", "50"],
      "F_Kreatívna predstavivosť": ["15", "30", "45", "60"]
    }
  },
  "questions": [
    { "id": "1", "text": "je spoločenský, rád trávi čas s inými ľuďmi.", "type": "likert" },
    { "id": "2", "text": "je súcitný, má dobré srdce.", "type": "likert" },
    { "id": "3", "text": "má sklon byť chaotický.", "type": "likert" },
    { "id": "4", "text": "je uvoľnený, dobre zvláda stres.", "type": "likert" },
    { "id": "5", "text": "má málo umeleckých záujmov.", "type": "likert" },
    { "id": "6", "text": "má asertívnu osobnosť, vyjadruje svoje názory.", "type": "likert" },
    { "id": "7", "text": "je úctivý, správa sa k iným úctivo.", "type": "likert" },
    { "id": "8", "text": "má sklon byť lenivý.", "type": "likert" },
    { "id": "9", "text": "ostáva optimistický napriek prekážkam.", "type": "likert" },
    { "id": "10", "text": "je zvedavý na mnoho rozličných vecí.", "type": "likert" },
    { "id": "11", "text": "je málokedy pre niečo zapálený.", "type": "likert" },
    { "id": "12", "text": "má sklon hľadať chyby v ostatných.", "type": "likert" },
    { "id": "13", "text": "je spoľahlivý a dôsledný.", "type": "likert" },
    { "id": "14", "text": "je náladový, máva výkyvy nálady.", "type": "likert" },
    { "id": "15", "text": "je vynaliezavý, hľadá šikovné spôsoby ako robiť veci.", "type": "likert" },
    { "id": "16", "text": "má sklon byť tichý.", "type": "likert" },
    { "id": "17", "text": "cíti málo pochopenia a súcitu k iným.", "type": "likert" },
    { "id": "18", "text": "je systematický, rád udržiava veci v poriadku.", "type": "likert" },
    { "id": "19", "text": "môže bývať napätý.", "type": "likert" },
    { "id": "20", "text": "je očarený umením, hudbou alebo literatúrou.", "type": "likert" },
    { "id": "21", "text": "je dominantný, správa sa ako vodca.", "type": "likert" },
    { "id": "22", "text": "vyvoláva spory s inými.", "type": "likert" },
    { "id": "23", "text": "má problém začať nejakú úlohu.", "type": "likert" },
    { "id": "24", "text": "sa cíti sebaistý, je spokojný so sebou.", "type": "likert" },
    { "id": "25", "text": "sa vyhýba intelektuálnym, filozofickým diskusiám.", "type": "likert" },
    { "id": "26", "text": "je menej aktívny než ostatní ľudia.", "type": "likert" },
    { "id": "27", "text": "má v povahe odpúšťať.", "type": "likert" },
    { "id": "28", "text": "môže byť trochu nedbanlivý.", "type": "likert" },
    { "id": "29", "text": "je emocionálne stabilný, neznepokojí sa tak ľahko.", "type": "likert" },
    { "id": "30", "text": "je málo tvorivý.", "type": "likert" },
    { "id": "31", "text": "je niekedy hanblivý, uzavretý.", "type": "likert" },
    { "id": "32", "text": "je nápomocný a nezištný k iným.", "type": "likert" },
    { "id": "33", "text": "udržuje svoje veci usporiadané a zorganizované.", "type": "likert" },
    { "id": "34", "text": "sa veľa znepokojuje.", "type": "likert" },
    { "id": "35", "text": "si cení umenie a krásu.", "type": "likert" },
    { "id": "36", "text": "pokladá za ťažké ovplyvňovať ľudí.", "type": "likert" },
    { "id": "37", "text": "je niekedy hrubý k iným.", "type": "likert" },
    { "id": "38", "text": "je efektívny, veci dokončí.", "type": "likert" },
    { "id": "39", "text": "sa často cíti smutný.", "type": "likert" },
    { "id": "40", "text": "rozmýšľa komplexne, do hĺbky.", "type": "likert" },
    { "id": "41", "text": "je plný energie.", "type": "likert" },
    { "id": "42", "text": "je podozrievavý voči úmyslom iných.", "type": "likert" },
    { "id": "43", "text": "je dôveryhodný, dá sa na neho vždy spoľahnúť.", "type": "likert" },
    { "id": "44", "text": "má svoje emócie pod kontrolou.", "type": "likert" },
    { "id": "45", "text": "má problém predstavovať si veci.", "type": "likert" },
    { "id": "46", "text": "je zhovorčivý.", "type": "likert" },
    { "id": "47", "text": "môže byť chladný a ľahostajný.", "type": "likert" },
    { "id": "48", "text": "zanecháva neporiadok, neupratuje.", "type": "likert" },
    { "id": "49", "text": "zriedkakedy cíti úzkosť alebo obavy.", "type": "likert" },
    { "id": "50", "text": "považuje poéziu a divadlo za nudné.", "type": "likert" },
    { "id": "51", "text": "preferuje, aby iní robili rozhodnutia.", "type": "likert" },
    { "id": "52", "text": "je slušný, zdvorilý voči iným.", "type": "likert" },
    { "id": "53", "text": "je vytrvalý, pracuje pokiaľ nie je úloha dokončená.", "type": "likert" },
    { "id": "54", "text": "má sklon cítiť sa skľúčený, skleslý.", "type": "likert" },
    { "id": "55", "text": "má malý záujem o abstraktné myšlienky.", "type": "likert" },
    { "id": "56", "text": "prejavuje veľa nadšenia.", "type": "likert" },
    { "id": "57", "text": "si myslí o ľuďoch to najlepšie.", "type": "likert" },
    { "id": "58", "text": "sa niekedy správa nezodpovedne.", "type": "likert" },
    { "id": "59", "text": "je temperamentný, ľahko sa rozčúli.", "type": "likert" },
    { "id": "60", "text": "je originálny, prichádza s novými nápadmi.", "type": "likert" }
  ]
}`);
    const [parsedData, setParsedData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'import' | 'library' | 'build'>('library');
    const [templateLibrary, setTemplateLibrary] = useState<any[]>([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

    // Auto-parse JSON for live preview
    useEffect(() => {
        try {
            const parsed = JSON.parse(jsonInput);
            setParsedData(parsed);
            setError(null);
        } catch (e) {
            setError("Invalid JSON format");
            setParsedData(null);
        }
    }, [jsonInput]);

    const handleImport = async () => {
        if (!parsedData) return;
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('access_token');
            await axios.post(`${API_BASE_URL}/api/v1/admin/templates/import`, parsedData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess(`Template imported successfully!`);
            fetchTemplateLibrary(); // refresh library
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                // FastAPI validation error array
                const messages = detail.map((d: any) => `${d.loc?.join('.')} - ${d.msg}`).join('; ');
                setError(messages);
            } else if (typeof detail === 'object' && detail !== null) {
                setError(JSON.stringify(detail));
            } else {
                setError(detail || "Failed to import template");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const fetchTemplateLibrary = async () => {
        setLibraryLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get(`${API_BASE_URL}/api/v1/admin/templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplateLibrary(res.data);
        } catch (err) {
            console.error('Failed to load template library', err);
        } finally {
            setLibraryLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string, name: string) => {
        if (!window.confirm(`Naozaj chcete vymazať šablónu "${name}"? Táto akcia je nevratná.`)) return;
        try {
            const token = localStorage.getItem('access_token');
            await axios.delete(`${API_BASE_URL}/api/v1/admin/templates/${templateId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeleteSuccess(`Šablóna "${name}" bola vymazaná.`);
            fetchTemplateLibrary();
            setTimeout(() => setDeleteSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete template');
        }
    };

    useEffect(() => {
        if (activeTab === 'library') fetchTemplateLibrary();
    }, [activeTab]);

    // Inline editing logic
    const handleQuestionTextChange = (qId: string | number, newText: string) => {
        if (!parsedData) return;
        const updated = { ...parsedData };
        const qIdStr = String(qId);
        const qIndex = updated.questions.findIndex((q: any) => String(q.id) === qIdStr);
        if (qIndex !== -1) {
            updated.questions[qIndex].text = newText;
            setJsonInput(JSON.stringify(updated, null, 2));
        }
    };

    const toggleReverseItem = (qId: string | number) => {
        if (!parsedData || !parsedData.scoring_logic) return;
        const updated = { ...parsedData };
        const reverseItems = updated.scoring_logic.reverse_items || [];
        const qIdStr = String(qId);
        const qIdNum = Number(qId);
        // Check if item is already reversed (handle both string and number IDs)
        const isIncluded = reverseItems.some((id: any) => String(id) === qIdStr);
        if (isIncluded) {
            updated.scoring_logic.reverse_items = reverseItems.filter((id: any) => String(id) !== qIdStr);
        } else {
            // Keep original type (number or string) consistent with existing items in array
            const useNumeric = reverseItems.length > 0 && typeof reverseItems[0] === 'number';
            updated.scoring_logic.reverse_items = [...reverseItems, useNumeric ? qIdNum : qIdStr];
        }
        setJsonInput(JSON.stringify(updated, null, 2));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Universal Assessment Engine</h1>
                    <p className="text-slate-500 mt-1">Import and configure psychological assessment templates via JSON.</p>
                </div>
                {activeTab === 'import' && (
                    <button
                        onClick={handleImport}
                        disabled={isSaving || !!error || !parsedData}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        {isSaving ? <Upload className="h-4 w-4 animate-bounce" /> : <Save className="h-4 w-4" />}
                        Publish Template
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('library')}
                    className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'library'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                        }`}
                >
                    <BookOpen className="h-4 w-4" /> Template Library
                    {templateLibrary.length > 0 && (
                        <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">{templateLibrary.length}</span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('build')}
                    className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'build'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                        }`}
                >
                    <PencilRuler className="h-4 w-4" /> Build New
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={`px-5 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'import'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                        }`}
                >
                    <Upload className="h-4 w-4" /> Import JSON
                </button>
            </div>

            {/* Assessment Builder Panel */}
            {
                activeTab === 'build' && (
                    <div className="flex-1">
                        <AssessmentBuilder
                            onSuccess={() => {
                                setActiveTab('library');
                                fetchTemplateLibrary();
                            }}
                        />
                    </div>
                )
            }

            {/* Template Library Panel */}
            {
                activeTab === 'library' && (
                    <div className="flex-1">
                        {deleteSuccess && (
                            <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-md flex items-center gap-2 border border-emerald-200 text-sm">
                                <CheckCircle2 className="h-4 w-4" /> {deleteSuccess}
                            </div>
                        )}
                        {libraryLoading ? (
                            <div className="flex justify-center items-center py-20 text-slate-400">Načítavam knižnicu...</div>
                        ) : templateLibrary.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <BookOpen className="h-12 w-12 mb-4 opacity-40" />
                                <p className="font-medium">Žiadne šablóny</p>
                                <p className="text-sm mt-1">Importujte prvý dotazník cez záložku "Import New"</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {templateLibrary.map((tmpl: any) => (
                                    <div key={tmpl.template_id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-semibold text-slate-800 text-sm leading-tight">{tmpl.name}</h3>
                                                <button
                                                    onClick={() => handleDeleteTemplate(tmpl.template_id, tmpl.name)}
                                                    className="shrink-0 ml-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                                    title="Vymazať šablónu"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{tmpl.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {tmpl.versions.map((v: any) => (
                                                    <span key={v.version_id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">v{v.version_tag}</span>
                                                ))}
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Scale: {tmpl.scale}</span>
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tmpl.n_questions} otázok</span>
                                            </div>
                                            {tmpl.dimensions.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 mb-1.5">Dimenzie:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {tmpl.dimensions.filter((d: string) => !d.startsWith('F_')).map((dim: string) => (
                                                            <span key={dim} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded border border-violet-100">{dim}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* Import Panel */}
            {
                activeTab === 'import' && (<>
                    {error && (
                        <div className="mb-6 bg-rose-50 text-rose-700 p-4 rounded-md flex items-start gap-3 border border-rose-200">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-sm">JSON Validation Error</h3>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-emerald-50 text-emerald-800 p-4 rounded-md flex items-center gap-3 border border-emerald-200">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px] pb-12">
                        {/* Left Panel: JSON Editor */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                                <h2 className="font-medium text-slate-700 text-sm font-mono">schema_editor.json</h2>
                            </div>
                            <textarea
                                className="flex-1 w-full p-4 font-mono text-sm text-slate-300 bg-slate-900 outline-none resize-none leading-relaxed"
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                spellCheck="false"
                            />
                        </div>

                        {/* Right Panel: Live Preview & Inline Editor */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                            <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center gap-2">
                                <Play className="h-4 w-4 text-indigo-600" />
                                <h2 className="font-medium text-indigo-900 text-sm">Live Preview & Inline Editor</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                {parsedData ? (
                                    <div className="max-w-xl mx-auto space-y-8">
                                        <div className="text-center mb-8 pb-6 border-b border-slate-200">
                                            <h1 className="text-2xl font-bold text-slate-900">{parsedData?.template_metadata?.name || parsedData?.template_metadata?.title || 'Untitled Assessment'}</h1>
                                            <p className="text-slate-500 mt-2">{parsedData?.template_metadata?.description || 'No description provided.'}</p>
                                            <div className="mt-4 flex justify-center gap-2">
                                                <span className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full font-bold tracking-wide">v{parsedData?.template_metadata?.version || '0.0'}</span>
                                                <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold tracking-wide">
                                                    Scale: {typeof parsedData?.scoring_logic?.scale === 'object'
                                                        ? `${parsedData.scoring_logic.scale.min || 0}-${parsedData.scoring_logic.scale.max || 5}`
                                                        : String(parsedData?.scoring_logic?.scale || '1-5')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {(Array.isArray(parsedData?.questions) ? parsedData.questions : []).map((q: any, i: number) => {
                                                const reverseArray = Array.isArray(parsedData?.scoring_logic?.reverse_items) ? parsedData.scoring_logic.reverse_items : [];
                                                const isReverse = reverseArray.some((rid: any) => String(rid) === String(q.id));
                                                // Find which dimensions this question belongs to
                                                const dimsTargeted = Object.entries(parsedData?.scoring_logic?.dimensions || {})
                                                    .filter(([_, qids]: any) => Array.isArray(qids) && qids.some((qid: any) => String(qid) === String(q.id)))
                                                    .map(([dim]) => dim);

                                                return (
                                                    <div key={q.id || i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative group hover:border-indigo-300 transition-colors">
                                                        <div className="absolute -top-3 left-4 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-sm">
                                                            Q{q.id || i + 1}
                                                        </div>
                                                        <div className="absolute top-3 right-4 flex gap-2">
                                                            {dimsTargeted.map(dim => (
                                                                <span key={dim} className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                    {dim}
                                                                </span>
                                                            ))}
                                                            <button
                                                                onClick={() => toggleReverseItem(q.id)}
                                                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded transition-colors ${isReverse ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                title="Toggle reverse scoring for this item"
                                                            >
                                                                {isReverse ? 'REVERSE (R)' : 'NORMAL'}
                                                            </button>
                                                        </div>
                                                        <div className="mt-2 text-slate-800 font-medium">
                                                            <input
                                                                type="text"
                                                                value={q.text || ''}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuestionTextChange(q.id, e.target.value)}
                                                                className="w-full mt-2 outline-none border-b border-transparent focus:border-indigo-300 transition-colors py-1 bg-transparent"
                                                                placeholder="Enter question text here..."
                                                            />
                                                        </div>
                                                        <div className="mt-3 flex gap-2 w-full justify-between items-center opacity-50 pointer-events-none">
                                                            {[1, 2, 3, 4, 5].map(n => (
                                                                <div key={n} className="flex flex-col items-center gap-1">
                                                                    <div className="h-4 w-4 rounded-full border border-slate-300"></div>
                                                                    <span className="text-[10px] text-slate-400">{n}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!Array.isArray(parsedData?.questions) || parsedData.questions.length === 0) && (
                                                <div className="text-center text-slate-400 py-12 border-2 border-dashed border-slate-200 rounded-lg">
                                                    Add questions in the JSON editor down left to see them previewed here.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        Waiting for valid JSON configuration...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>)
            }
        </div >
    );
}
