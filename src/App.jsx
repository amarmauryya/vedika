import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { Plus, Trash2, Save, LogOut, UserPlus, ArrowLeft } from "lucide-react";
import "./App.css";

const ALLOWED_ADMINS = ["ayushkft@gmail.com"];

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [view, setView] = useState("select");

  const [template, setTemplate] = useState({
    title: "", categoryId: "festival", tags: [], language: "en",
    thumbnailUrl: "", previewUrl: "", backgroundUrl: "",
    canvasWidth: 1080, canvasHeight: 1080, isActive: true, isVideo: false, sortOrder: 0,
  });

  const [videoTemplate, setVideoTemplate] = useState({
    title: "", categoryId: "festival", tags: [], language: "en",
    videoUrl: "", thumbnailUrl: "",
    canvasWidth: 1080, canvasHeight: 1920, isActive: true, isVideo: true, sortOrder: 0,
  });

  const [elements, setElements] = useState([{
    id: "user_name", type: "text", x: 100, y: 800, width: 880, height: 100,
    editable: true, dataKey: "user.name", text: "YOUR NAME",
    color: "#FFFFFF", fontSize: 60, fontFamily: "Inter", alignment: "center", fontWeight: "bold",
  }]);

  const [tagInput, setTagInput] = useState("");
  const [videoTagInput, setVideoTagInput] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (ALLOWED_ADMINS.includes(u.email?.toLowerCase())) {
          setIsAdmin(true);
        } else {
          try {
            const snap = await getDoc(doc(db, "config", "admins"));
            setIsAdmin(snap.exists() && snap.data().emails?.includes(u.email?.toLowerCase()));
          } catch { setIsAdmin(false); }
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(getAuth(), email, password);
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        try { await createUserWithEmailAndPassword(getAuth(), email, password); }
        catch (e2) { alert("Login failed: " + e2.message); }
      } else { alert("Login failed: " + err.message); }
    }
  };

  const addElement = () => setElements([...elements, {
    id: `element_${elements.length + 1}`, type: "text", x: 0, y: 0,
    width: 200, height: 50, editable: true, dataKey: "",
    text: "New Text", color: "#FFFFFF", fontSize: 40,
    fontFamily: "Inter", alignment: "left", fontWeight: "normal", mask: "", imageUrl: "",
  }]);

  const removeElement = (i) => { const e = [...elements]; e.splice(i, 1); setElements(e); };

  const handleElementChange = (i, f, value) => {
    const e = [...elements];
    e[i][f] = ["x","y","width","height","fontSize"].includes(f) ? Number(value) : value;
    setElements(e);
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!template.tags.includes(tagInput.trim().toLowerCase()))
        setTemplate({ ...template, tags: [...template.tags, tagInput.trim().toLowerCase()] });
      setTagInput("");
    }
  };

  const handleVideoAddTag = (e) => {
    if (e.key === "Enter" && videoTagInput.trim()) {
      e.preventDefault();
      if (!videoTemplate.tags.includes(videoTagInput.trim().toLowerCase()))
        setVideoTemplate({ ...videoTemplate, tags: [...videoTemplate.tags, videoTagInput.trim().toLowerCase()] });
      setVideoTagInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await addDoc(collection(db, "templates"), { ...template, elements, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      alert("Image Template uploaded!");
      setTemplate({ ...template, title: "", backgroundUrl: "", thumbnailUrl: "", previewUrl: "", tags: [] });
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!videoTemplate.videoUrl.trim()) { alert("MP4 Video URL required!"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "templates"), {
        ...videoTemplate, backgroundUrl: videoTemplate.videoUrl, previewUrl: videoTemplate.thumbnailUrl,
        elements: [{ id: "user_name", type: "text", x: 60, y: 1600, width: 960, height: 120, editable: true, dataKey: "user.name", text: "YOUR NAME", color: "#FFFFFF", fontSize: 70, fontFamily: "Inter", alignment: "center", fontWeight: "bold" }],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      alert("Video Template uploaded!");
      setVideoTemplate({ ...videoTemplate, title: "", videoUrl: "", thumbnailUrl: "", tags: [] });
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    try {
      const ref = doc(db, "config", "admins");
      const snap = await getDoc(ref);
      const emails = snap.exists() ? (snap.data().emails || []) : [];
      if (!emails.includes(newAdminEmail.trim().toLowerCase())) {
        emails.push(newAdminEmail.trim().toLowerCase());
        await setDoc(ref, { emails }, { merge: true });
        alert(`Admin access granted to ${newAdminEmail}!`);
        setNewAdminEmail("");
      } else alert("Already an admin!");
    } catch (e) { alert("Error: " + e.message); }
  };

  const CATEGORIES = [
    { value: "festival", label: "Festival" }, { value: "birthday", label: "Birthday" },
    { value: "business", label: "Business" }, { value: "good_morning", label: "Good Morning" },
    { value: "motivational", label: "Motivational" }, { value: "political", label: "Political" },
  ];

  if (authLoading) return <div className="loading-screen"><div className="spinner"></div><p>Loading...</p></div>;

  if (!user) return (
    <div className="login-bg">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="login-logo">
          <span>प</span>
        </div>
        <h2>Post Parchaar Admin</h2>
        <p className="login-sub">Sign in to manage templates</p>
        <div className="form-group">
          <label>Email</label>
          <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button type="submit" className="btn btn-primary btn-block">Sign In</button>
      </form>
    </div>
  );

  if (user && !isAdmin) return (
    <div className="access-denied">
      <div className="denied-icon">🚫</div>
      <h2>Access Denied</h2>
      <p>{user.email} is not authorized.</p>
      <button onClick={() => signOut(getAuth())} className="btn btn-danger">Logout</button>
    </div>
  );

  return (
    <div className="admin-app">
      <header className="topbar">
        <div className="topbar-left">
          {view !== "select" && (
            <button className="back-btn" onClick={() => setView("select")}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <div className="brand">
            <div className="brand-logo">प</div>
            <div>
              <div className="brand-name">Post Parchaar</div>
              <div className="brand-sub">Admin Dashboard</div>
            </div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="add-admin-box">
            <input type="email" placeholder="Add admin email..." value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="add-admin-input" />
            <button onClick={handleAddAdmin} className="btn btn-success btn-sm">
              <UserPlus size={14} /> Add
            </button>
          </div>
          <span className="user-email">{user.email}</span>
          <button onClick={() => signOut(getAuth())} className="btn btn-outline-danger btn-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <main className="main-content">

        {view === "select" && (
          <div className="select-view">
            <h1 className="page-title">Create New Template</h1>
            <p className="page-sub">Choose the type of template you want to upload</p>
            <div className="template-type-grid">
              <div className="type-card image-card" onClick={() => setView("image")}>
                <div className="type-card-icon image-icon">🖼️</div>
                <h2>Image Template</h2>
                <p>Upload poster templates with image background, text and logo elements</p>
                <div className="type-card-btn image-btn">Create Image Template →</div>
              </div>
              <div className="type-card video-card" onClick={() => setView("video")}>
                <div className="type-card-icon video-icon">🎬</div>
                <h2>Video Template</h2>
                <p>Upload video templates with MP4 background and overlay text elements</p>
                <div className="type-card-btn video-btn">Create Video Template →</div>
              </div>
            </div>
          </div>
        )}

        {view === "image" && (
          <div>
            <div className="page-header">
              <div className="page-header-icon image-icon-sm">🖼️</div>
              <div>
                <h1 className="page-title">Image Template</h1>
                <p className="page-sub">Fill in the details and upload your poster template</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="two-col-form">
              <div className="col-left">
                <div className="card">
                  <h3 className="card-title">Template Details</h3>
                  <div className="form-group">
                    <label>Title *</label>
                    <input required className="input" value={template.title} onChange={e => setTemplate({...template, title: e.target.value})} placeholder="e.g. Diwali Poster 2024" />
                  </div>
                  <div className="two-inputs">
                    <div className="form-group">
                      <label>Category</label>
                      <select className="input" value={template.categoryId} onChange={e => setTemplate({...template, categoryId: e.target.value})}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Sort Order</label>
                      <input type="number" className="input" value={template.sortOrder} onChange={e => setTemplate({...template, sortOrder: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tags (Enter to add)</label>
                    <div className="tags-row">
                      {template.tags.map(t => (
                        <span key={t} className="tag image-tag">
                          {t} <button type="button" onClick={() => setTemplate({...template, tags: template.tags.filter(x => x !== t)})}>✕</button>
                        </span>
                      ))}
                    </div>
                    <input className="input" placeholder="Type and press Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleAddTag} />
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title">Media URLs</h3>
                  <div className="form-group">
                    <label>Background Image URL *</label>
                    <input required className="input" value={template.backgroundUrl} onChange={e => setTemplate({...template, backgroundUrl: e.target.value})} placeholder="https://firebasestorage.../image.jpg" />
                    {template.backgroundUrl && <img src={template.backgroundUrl} className="media-preview" alt="bg" onError={e => e.target.style.display="none"} />}
                  </div>
                  <div className="form-group">
                    <label>Thumbnail URL <span className="optional">(optional)</span></label>
                    <input className="input" value={template.thumbnailUrl} onChange={e => setTemplate({...template, thumbnailUrl: e.target.value, previewUrl: e.target.value})} placeholder="https://...thumb.jpg" />
                  </div>
                  <div className="two-inputs">
                    <div className="form-group"><label>Canvas W</label><input type="number" className="input" value={template.canvasWidth} onChange={e => setTemplate({...template, canvasWidth: Number(e.target.value)})} /></div>
                    <div className="form-group"><label>Canvas H</label><input type="number" className="input" value={template.canvasHeight} onChange={e => setTemplate({...template, canvasHeight: Number(e.target.value)})} /></div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-image btn-block btn-lg">
                  <Save size={18} /> {loading ? "Uploading..." : "Upload Image Template"}
                </button>
              </div>

              <div className="col-right card elements-panel">
                <div className="elements-header">
                  <h3 className="card-title" style={{margin:0}}>Elements</h3>
                  <button type="button" onClick={addElement} className="btn btn-add-element">
                    <Plus size={14} /> Add Element
                  </button>
                </div>
                {elements.map((el, i) => (
                  <div key={i} className="element-card">
                    <div className="element-header">
                      <span className="element-label">ELEMENT {i+1} — {el.type.toUpperCase()}</span>
                      <button type="button" onClick={() => removeElement(i)} className="btn-remove"><Trash2 size={14}/></button>
                    </div>
                    <div className="two-inputs">
                      <input placeholder="ID" className="input input-sm" value={el.id} onChange={e => handleElementChange(i, "id", e.target.value)} />
                      <select className="input input-sm" value={el.type} onChange={e => handleElementChange(i, "type", e.target.value)}>
                        <option value="text">Text</option><option value="image">Image</option>
                      </select>
                    </div>
                    <div className="four-inputs">
                      {["x","y","width","height"].map(k => <input key={k} type="number" placeholder={k.toUpperCase()} className="input input-sm" value={el[k]} onChange={e => handleElementChange(i, k, e.target.value)} />)}
                    </div>
                    <div className="two-inputs" style={{alignItems:"center"}}>
                      <input placeholder="Data Key (user.name)" className="input input-sm" value={el.dataKey} onChange={e => handleElementChange(i, "dataKey", e.target.value)} />
                      <label className="checkbox-label"><input type="checkbox" checked={el.editable} onChange={e => handleElementChange(i, "editable", e.target.checked)} /> Editable</label>
                    </div>
                    {el.type === "text" && (
                      <div className="text-controls">
                        <input placeholder="Default Text" className="input input-sm" style={{flex:1}} value={el.text} onChange={e => handleElementChange(i, "text", e.target.value)} />
                        <input type="color" className="color-input" value={el.color} onChange={e => handleElementChange(i, "color", e.target.value)} />
                        <input type="number" placeholder="Sz" className="input input-sm" style={{width:"60px"}} value={el.fontSize} onChange={e => handleElementChange(i, "fontSize", e.target.value)} />
                        <select className="input input-sm" style={{width:"85px"}} value={el.alignment} onChange={e => handleElementChange(i, "alignment", e.target.value)}>
                          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                        </select>
                      </div>
                    )}
                    {el.type === "image" && (
                      <select className="input input-sm" value={el.mask} onChange={e => handleElementChange(i, "mask", e.target.value)}>
                        <option value="">No Mask</option><option value="circle">Circle</option><option value="rounded_rectangle">Rounded Rect</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </form>
          </div>
        )}

        {view === "video" && (
          <div className="video-view">
            <div className="page-header">
              <div className="page-header-icon video-icon-sm">🎬</div>
              <div>
                <h1 className="page-title">Video Template</h1>
                <p className="page-sub">Upload your MP4 video template with details</p>
              </div>
            </div>
            <form onSubmit={handleVideoSubmit} className="single-col-form">
              <div className="card">
                <h3 className="card-title">Video Details</h3>
                <div className="form-group">
                  <label>Video Title *</label>
                  <input required className="input" value={videoTemplate.title} onChange={e => setVideoTemplate({...videoTemplate, title: e.target.value})} placeholder="e.g. Independence Day Video 2024" />
                </div>
                <div className="two-inputs">
                  <div className="form-group">
                    <label>Category</label>
                    <select className="input" value={videoTemplate.categoryId} onChange={e => setVideoTemplate({...videoTemplate, categoryId: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input type="number" className="input" value={videoTemplate.sortOrder} onChange={e => setVideoTemplate({...videoTemplate, sortOrder: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Tags (Enter to add)</label>
                  <div className="tags-row">
                    {videoTemplate.tags.map(t => (
                      <span key={t} className="tag video-tag">
                        {t} <button type="button" onClick={() => setVideoTemplate({...videoTemplate, tags: videoTemplate.tags.filter(x => x !== t)})}>✕</button>
                      </span>
                    ))}
                  </div>
                  <input className="input" placeholder="Type and press Enter..." value={videoTagInput} onChange={e => setVideoTagInput(e.target.value)} onKeyDown={handleVideoAddTag} />
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Video & Thumbnail</h3>
                <div className="form-group">
                  <label>MP4 Video URL *</label>
                  <input required className="input input-video" value={videoTemplate.videoUrl} onChange={e => setVideoTemplate({...videoTemplate, videoUrl: e.target.value})} placeholder="https://firebasestorage.../video.mp4" />
                  <p className="hint">Firebase Storage ya kisi bhi direct MP4 URL paste karein</p>
                </div>
                {videoTemplate.videoUrl && (
                  <div className="video-preview-wrap">
                    <video src={videoTemplate.videoUrl} controls className="video-preview" />
                    <div className="video-success">✅ Video loaded successfully</div>
                  </div>
                )}
                <div className="form-group" style={{marginTop:"16px"}}>
                  <label>Thumbnail URL <span className="optional">(optional — card preview ke liye)</span></label>
                  <input className="input" value={videoTemplate.thumbnailUrl} onChange={e => setVideoTemplate({...videoTemplate, thumbnailUrl: e.target.value})} placeholder="https://...thumbnail.jpg" />
                  {videoTemplate.thumbnailUrl && <img src={videoTemplate.thumbnailUrl} className="media-preview" alt="thumb" onError={e => e.target.style.display="none"} />}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-video btn-block btn-lg">
                <Save size={18} /> {loading ? "Uploading..." : "Upload Video Template to Firebase"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;