import React, { useState } from 'react';
import { db, storage } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Save } from 'lucide-react';

const IMAGE_LAYOUT_PRESETS = [
  {
    name: "Style 1: Name Bottom Center",
    elements: [
      { id: "user_name", type: "text", x: 100, y: 920, width: 880, height: 100, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 60, fontFamily: "Inter", alignment: "center", fontWeight: "bold" }
    ]
  },
  {
    name: "Style 2: Photo Left, Name Right",
    elements: [
      { id: "user_photo", type: "image", x: 80, y: 850, width: 200, height: 200, editable: true, dataKey: "user.photoUrl", mask: "circle" },
      { id: "user_name", type: "text", x: 300, y: 900, width: 700, height: 100, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 50, fontFamily: "Inter", alignment: "left", fontWeight: "bold" }
    ]
  },
  {
    name: "Style 3: Photo Right, Name Left",
    elements: [
      { id: "user_name", type: "text", x: 80, y: 900, width: 700, height: 100, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 50, fontFamily: "Inter", alignment: "right", fontWeight: "bold" },
      { id: "user_photo", type: "image", x: 800, y: 850, width: 200, height: 200, editable: true, dataKey: "user.photoUrl", mask: "circle" }
    ]
  },
  {
    name: "Style 4: Name + Business Name",
    elements: [
      { id: "user_name", type: "text", x: 100, y: 850, width: 880, height: 80, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 55, fontFamily: "Inter", alignment: "center", fontWeight: "bold" },
      { id: "business_name", type: "text", x: 100, y: 940, width: 880, height: 60, editable: true, dataKey: "user.businessName", text: "BUSINESS NAME", color: "#FFD700", fontSize: 40, fontFamily: "Inter", alignment: "center", fontWeight: "normal" }
    ]
  },
  {
    name: "Style 5: Full Contact Info",
    elements: [
      { id: "user_name", type: "text", x: 100, y: 800, width: 880, height: 80, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 50, fontFamily: "Inter", alignment: "center", fontWeight: "bold" },
      { id: "phone", type: "text", x: 100, y: 890, width: 880, height: 60, editable: true, dataKey: "user.phone", text: "📞 9876543210", color: "#FFFFFF", fontSize: 40, fontFamily: "Inter", alignment: "center", fontWeight: "normal" },
      { id: "email", type: "text", x: 100, y: 960, width: 880, height: 60, editable: true, dataKey: "user.email", text: "✉️ email@example.com", color: "#FFFFFF", fontSize: 35, fontFamily: "Inter", alignment: "center", fontWeight: "normal" }
    ]
  },
  {
    name: "Style 6: Logo Top Right, Name Bottom",
    elements: [
      { id: "user_logo", type: "image", x: 850, y: 50, width: 180, height: 180, editable: true, dataKey: "user.photoUrl", mask: "none" },
      { id: "user_name", type: "text", x: 100, y: 920, width: 880, height: 100, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 60, fontFamily: "Inter", alignment: "center", fontWeight: "bold" }
    ]
  },
  {
    name: "Style 7: Empty (No Elements)",
    elements: []
  }
];

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Save timed out — please retry")), ms));

export default function BulkUpload({ onBack, showToast }) {
  const [jsonText, setJsonText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({}); // { filename: { status: 'pending|uploading|done|failed', error: '' } }
  const [isProcessing, setIsProcessing] = useState(false);

  const handleJsonLoad = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array of objects.");
      setParsedEntries(parsed);
      
      const newStatus = {};
      parsed.forEach(entry => {
        if (!entry.file) throw new Error("Each entry must have a 'file' property");
        newStatus[entry.file] = { status: 'pending', error: '' };
      });
      setUploadStatus(newStatus);
      showToast("JSON loaded successfully!", "success");
    } catch (err) {
      showToast("Invalid JSON: " + err.message, "error");
    }
  };

  const uploadFileAndSave = async (entry, fileObj) => {
    setUploadStatus(prev => ({ ...prev, [entry.file]: { status: 'uploading', error: '' } }));
    
    try {
      // 1. Storage Upload
      const fileRef = ref(storage, \`templates/\${Date.now()}_\${fileObj.name}\`);
      const uploadTask = uploadBytesResumable(fileRef, fileObj);
      
      const uploadPromise = new Promise((resolve, reject) => {
        const unsub = uploadTask.on('state_changed', 
          null,
          (error) => { unsub(); reject(error); },
          async () => {
            unsub();
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (e2) { reject(e2); }
          }
        );
      });
      
      const downloadURL = await Promise.race([uploadPromise, timeout(30000)]);
      
      // 2. Prepare Template Data
      const preset = IMAGE_LAYOUT_PRESETS.find(p => p.name === entry.preset) || IMAGE_LAYOUT_PRESETS[0];
      const templateData = {
        title: entry.title || "Untitled",
        categoryId: entry.category || "festival",
        tags: entry.tags || [],
        language: "en",
        thumbnailUrl: downloadURL,
        previewUrl: downloadURL,
        backgroundUrl: downloadURL,
        canvasWidth: 1080,
        canvasHeight: 1080,
        isActive: true,
        isVideo: false,
        sortOrder: 0,
        elements: JSON.parse(JSON.stringify(preset.elements)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Firestore Save
      const savePromise = addDoc(collection(db, "templates"), templateData);
      await Promise.race([savePromise, timeout(30000)]);

      setUploadStatus(prev => ({ ...prev, [entry.file]: { status: 'done', error: '' } }));
    } catch (err) {
      console.error(\`Failed to upload \${entry.file}:\`, err);
      setUploadStatus(prev => ({ ...prev, [entry.file]: { status: 'failed', error: err.message } }));
    }
  };

  const startBulkUpload = async () => {
    if (parsedEntries.length === 0) return showToast("Load JSON first", "error");
    if (selectedFiles.length === 0) return showToast("Select images first", "error");

    setIsProcessing(true);
    
    const fileMap = {};
    Array.from(selectedFiles).forEach(f => fileMap[f.name] = f);

    // Process one by one (or could use Promise.all but sequential is safer for logs)
    for (const entry of parsedEntries) {
      if (uploadStatus[entry.file]?.status === 'done') continue; // Skip already done
      
      const fileObj = fileMap[entry.file];
      if (!fileObj) {
        setUploadStatus(prev => ({ ...prev, [entry.file]: { status: 'failed', error: 'File not found in selected images' } }));
        continue;
      }
      
      await uploadFileAndSave(entry, fileObj);
    }
    
    setIsProcessing(false);
    showToast("Bulk processing completed!", "success");
  };

  const retryFile = async (entry) => {
    const fileMap = {};
    Array.from(selectedFiles).forEach(f => fileMap[f.name] = f);
    const fileObj = fileMap[entry.file];
    if (!fileObj) return showToast("File not found in selected images", "error");
    await uploadFileAndSave(entry, fileObj);
  };

  const successCount = parsedEntries.filter(e => uploadStatus[e.file]?.status === 'done').length;
  const failedCount = parsedEntries.filter(e => uploadStatus[e.file]?.status === 'failed').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-icon" style={{background:'#e0e7ff',color:'#4f46e5'}}>📦</div>
        <div>
          <h1 className="page-title">Bulk Upload Templates</h1>
          <p className="page-sub">Upload multiple images with a JSON configuration</p>
        </div>
      </div>
      
      <div className="two-col-form">
        <div className="col-left">
          <div className="card">
            <h3 className="card-title">1. Paste JSON Config</h3>
            <textarea 
              className="input" 
              rows={8} 
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder={'[{\\n  "file": "image (8).jpeg",\\n  "title": "Diwali Offer",\\n  "category": "festival",\\n  "tags": ["hindi", "offer"],\\n  "preset": "Style 1: Name Bottom Center"\\n}]'}
            />
            <button onClick={handleJsonLoad} className="btn btn-outline-primary" style={{marginTop:'8px'}}>Load JSON File</button>
          </div>

          <div className="card">
            <h3 className="card-title">2. Select Images</h3>
            <input type="file" multiple accept="image/*" onChange={e => setSelectedFiles(e.target.files)} className="input" />
            <p style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>Selected: {selectedFiles.length} files</p>
          </div>

          <button onClick={startBulkUpload} disabled={isProcessing || parsedEntries.length === 0} className="btn btn-primary btn-block btn-lg">
            <Save size={18} /> {isProcessing ? "Processing Bulk Upload..." : "Start Bulk Upload"}
          </button>
        </div>

        <div className="col-right card elements-panel">
          <h3 className="card-title">Upload Status</h3>
          <p style={{marginBottom:'12px', fontWeight:'bold'}}>
            Progress: {successCount} / {parsedEntries.length} uploaded | {failedCount} failed
          </p>
          <div style={{maxHeight:'500px', overflowY:'auto'}}>
            {parsedEntries.map((entry, i) => {
              const statusData = uploadStatus[entry.file] || { status: 'pending', error: '' };
              return (
                <div key={i} style={{
                  padding: '12px', marginBottom: '8px', borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: statusData.status === 'done' ? '#f0fdf4' : statusData.status === 'failed' ? '#fef2f2' : '#f9fafb'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <strong style={{fontSize:'14px'}}>{entry.file}</strong>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                      background: statusData.status === 'done' ? '#22c55e' : statusData.status === 'failed' ? '#ef4444' : statusData.status === 'uploading' ? '#eab308' : '#cbd5e1',
                      color: 'white'
                    }}>
                      {statusData.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{fontSize:'12px', color:'#666', marginTop:'4px'}}>{entry.title} ({entry.preset})</div>
                  {statusData.error && (
                    <div style={{color:'#ef4444', fontSize:'12px', marginTop:'8px'}}>
                      Error: {statusData.error}
                      <br/>
                      <button onClick={() => retryFile(entry)} disabled={isProcessing} style={{marginTop:'4px', padding:'2px 8px', background:'#fee2e2', border:'1px solid #ef4444', color:'#ef4444', borderRadius:'4px', cursor:'pointer'}}>Retry File</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
