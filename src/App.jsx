import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, addDoc } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { Plus, Trash2, Save, LogOut } from 'lucide-react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(true)

  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState({
    title: '',
    categoryId: 'festival',
    tags: [],
    language: 'en',
    thumbnailUrl: '',
    previewUrl: '',
    backgroundUrl: '',
    canvasWidth: 1080,
    canvasHeight: 1080,
    isActive: true,
    sortOrder: 0
  })

  const [elements, setElements] = useState([
    {
      id: 'user_name',
      type: 'text',
      x: 100,
      y: 800,
      width: 880,
      height: 100,
      editable: true,
      dataKey: 'user.name',
      text: 'YOUR NAME',
      color: '#FFFFFF',
      fontSize: 60,
      fontFamily: 'Inter',
      alignment: 'center',
      fontWeight: 'bold'
    }
  ])

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const auth = getAuth()
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      alert("Login failed! " + error.message)
    }
  }

  const addElement = () => {
    setElements([...elements, {
      id: `element_${elements.length + 1}`,
      type: 'text',
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      editable: true,
      dataKey: '',
      text: 'New Text',
      color: '#FFFFFF',
      fontSize: 40,
      fontFamily: 'Inter',
      alignment: 'left',
      fontWeight: 'normal',
      mask: '',
      imageUrl: ''
    }])
  }

  const removeElement = (index) => {
    const newElements = [...elements]
    newElements.splice(index, 1)
    setElements(newElements)
  }

  const handleElementChange = (index, field, value) => {
    const newElements = [...elements]
    newElements[index][field] = field === 'x' || field === 'y' || field === 'width' || field === 'height' || field === 'fontSize' 
      ? Number(value) 
      : value
    setElements(newElements)
  }

  const [tagInput, setTagInput] = useState('')

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!template.tags.includes(tagInput.trim().toLowerCase())) {
        setTemplate({
          ...template,
          tags: [...template.tags, tagInput.trim().toLowerCase()]
        });
      }
      setTagInput('');
    }
  }

  const removeTag = (tagToRemove) => {
    setTemplate({
      ...template,
      tags: template.tags.filter(tag => tag !== tagToRemove)
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const templateData = {
        ...template,
        elements,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await addDoc(collection(db, 'templates'), templateData)
      alert('Template successfully uploaded to Firebase!')
      
      // Reset form
      setTemplate({ ...template, title: '', backgroundUrl: '', thumbnailUrl: '', previewUrl: '', tags: [] })
    } catch (error) {
      console.error("Error adding document: ", error)
      alert('Error uploading template. See console for details.')
    }
    setLoading(false)
  }

  if (authLoading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading...</div>

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#6200EE' }}>Admin Login</h2>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input type="email" required style={{ width: '100%', padding: '0.5rem' }} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input type="password" required style={{ width: '100%', padding: '0.5rem' }} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#6200EE', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Login</button>
        </form>
      </div>
    )
  }

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#333' }}>Poster Parchaar Admin</h1>
        <button onClick={() => signOut(getAuth())} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '8px' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '2rem' }}>
        
        {/* Left Column: Template Details */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '2rem', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Template Settings</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Title</label>
            <input required style={{ width: '100%', padding: '0.5rem' }} value={template.title} onChange={e => setTemplate({...template, title: e.target.value})} />
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Category</label>
              <select style={{ width: '100%', padding: '0.5rem' }} value={template.categoryId} onChange={e => setTemplate({...template, categoryId: e.target.value})}>
                <option value="festival">Festival</option>
                <option value="birthday">Birthday</option>
                <option value="business">Business</option>
                <option value="good_morning">Good Morning</option>
                <option value="motivational">Motivational</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tags (Press Enter to add)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {template.tags.map(tag => (
                  <span key={tag} style={{ backgroundColor: '#e0e0e0', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', padding: 0 }}>✕</button>
                  </span>
                ))}
              </div>
              <input 
                placeholder="Type tag and press enter" 
                style={{ width: '100%', padding: '0.5rem' }} 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Background Image URL</label>
            <input required style={{ width: '100%', padding: '0.5rem' }} value={template.backgroundUrl} onChange={e => setTemplate({...template, backgroundUrl: e.target.value})} />
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Canvas Width</label>
              <input type="number" style={{ width: '100%', padding: '0.5rem' }} value={template.canvasWidth} onChange={e => setTemplate({...template, canvasWidth: Number(e.target.value)})} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Canvas Height</label>
              <input type="number" style={{ width: '100%', padding: '0.5rem' }} value={template.canvasHeight} onChange={e => setTemplate({...template, canvasHeight: Number(e.target.value)})} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Preview/Thumbnail URL (Optional)</label>
            <input style={{ width: '100%', padding: '0.5rem' }} value={template.thumbnailUrl} onChange={e => setTemplate({...template, thumbnailUrl: e.target.value, previewUrl: e.target.value})} />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', padding: '1rem', marginTop: '2rem', 
              backgroundColor: '#6200EE', color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Save size={20} />
            {loading ? 'Uploading...' : 'Upload Template to Firebase'}
          </button>
        </div>

        {/* Right Column: Elements */}
        <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '2rem', borderRadius: '12px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Elements (Text/Images)</h2>
            <button type="button" onClick={addElement} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Plus size={16} /> Add Element
            </button>
          </div>

          {elements.map((el, index) => (
            <div key={index} style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <strong>Element {index + 1}</strong>
                <button type="button" onClick={() => removeElement(index)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <input placeholder="ID (e.g. user_name)" style={{ flex: 1 }} value={el.id} onChange={e => handleElementChange(index, 'id', e.target.value)} />
                <select style={{ flex: 1 }} value={el.type} onChange={e => handleElementChange(index, 'type', e.target.value)}>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="number" placeholder="X" style={{ width: '60px' }} value={el.x} onChange={e => handleElementChange(index, 'x', e.target.value)} />
                <input type="number" placeholder="Y" style={{ width: '60px' }} value={el.y} onChange={e => handleElementChange(index, 'y', e.target.value)} />
                <input type="number" placeholder="Width" style={{ width: '70px' }} value={el.width} onChange={e => handleElementChange(index, 'width', e.target.value)} />
                <input type="number" placeholder="Height" style={{ width: '70px' }} value={el.height} onChange={e => handleElementChange(index, 'height', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <input placeholder="Data Key (user.name)" style={{ flex: 1 }} value={el.dataKey} onChange={e => handleElementChange(index, 'dataKey', e.target.value)} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={el.editable} onChange={e => handleElementChange(index, 'editable', e.target.checked)} />
                  Editable
                </label>
              </div>

              {el.type === 'text' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input placeholder="Default Text" style={{ flex: 1 }} value={el.text} onChange={e => handleElementChange(index, 'text', e.target.value)} />
                  <input type="color" value={el.color} onChange={e => handleElementChange(index, 'color', e.target.value)} />
                  <input type="number" placeholder="Size" style={{ width: '60px' }} value={el.fontSize} onChange={e => handleElementChange(index, 'fontSize', e.target.value)} />
                  <select value={el.alignment} onChange={e => handleElementChange(index, 'alignment', e.target.value)}>
                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                  </select>
                </div>
              )}

              {el.type === 'image' && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                   <select value={el.mask} onChange={e => handleElementChange(index, 'mask', e.target.value)}>
                    <option value="">No Mask</option>
                    <option value="circle">Circle</option>
                    <option value="rounded_rectangle">Rounded Rect</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}

export default App
