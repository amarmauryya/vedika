const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

if (!code.includes('const timeout =')) {
  code = code.replace('import "./App.css";', 'import "./App.css";\n\nconst timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Save timed out — please retry")), ms));');
}

code = code.replace(/const handleFileUpload = async[\s\S]*?catch \(err\) \{[\s\S]*?\}\s*\};\s*const handleSubmit = async/g, `const handleFileUpload = async (e, setTemplateFunc, templateState, urlField) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    showToast("Uploading file...", "info");
    try {
      const fileRef = ref(storage, \`templates/\${Date.now()}_\${file.name}\`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
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
      if (urlField === "thumbnailUrl") {
          setTemplateFunc({ ...templateState, [urlField]: downloadURL, previewUrl: downloadURL });
      } else {
          setTemplateFunc({ ...templateState, [urlField]: downloadURL });
      }
      showToast("File uploaded successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Upload Error: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async`);

code = code.replace(/const handleSubmit = async \(e\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/, `const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!template.backgroundUrl || !template.thumbnailUrl) {
      showToast("Error: Background and Thumbnail Images are required! Wait for them to upload.", "error");
      return;
    }
    setLoading(true);
    try {
      const savePromise = addDoc(collection(db, "templates"), { ...template, elements, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await Promise.race([savePromise, timeout(30000)]);
      showToast("Image Template uploaded!", "success");
      setTemplate({ ...template, title: "", backgroundUrl: "", thumbnailUrl: "", previewUrl: "", tags: [] });
    } catch (err) { 
      console.error("Save Error:", err);
      showToast("Error: " + err.message, "error"); 
    } finally {
      setLoading(false);
    }
  };`);

fs.writeFileSync('src/App.jsx', code);
console.log('Patched single upload!');
