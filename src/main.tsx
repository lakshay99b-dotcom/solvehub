import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {supabase} from './lib/supabase';
import {acceptSolution,createProblem,createSolution,getProblem,getProblems,getProfile,getSolutions,recordView,toggleBookmark} from './lib/api';
import type {Difficulty,Problem,Profile,Solution} from './types';
import {Code2,Plus,Search,Bookmark,CheckCircle2,Eye,User} from 'lucide-react';
import './styles.css';

function App(){
  const [view,setView]=useState<'home'|'problem'|'profile'|'new'>('home');
  const [problems,setProblems]=useState<Problem[]>([]);
  const [selected,setSelected]=useState<Problem|null>(null);
  const [solutions,setSolutions]=useState<Solution[]>([]);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState('');
  const [title,setTitle]=useState('');
  const [description,setDescription]=useState('');
  const [difficulty,setDifficulty]=useState<Difficulty>('intermediate');
  const [tags,setTags]=useState('react,typescript');
  const [body,setBody]=useState('');
  const [user,setUser]=useState<any>(null);

  useEffect(()=>{
    (async()=>{
      try{
        const {data:{session}}=await supabase?.auth.getSession()??{data:{session:null}};
        setUser(session?.user??null);
        if(session?.user){
          const p=await getProfile(session.user.id);
          setProfile(p);
        }
        const list=await getProblems();
        setProblems(list);
      }catch(e){console.error(e)}
      setLoading(false);
    })();
  },[]);

  const filtered=useMemo(()=>problems.filter(p=>!query||p.title.toLowerCase().includes(query.toLowerCase())||p.description.toLowerCase().includes(query.toLowerCase())),[problems,query]);

  async function openProblem(p:Problem){
    setSelected(p);
    setView('problem');
    try{
      await recordView(p.id);
      const full=await getProblem(p.id);
      setSelected(full);
      const sols=await getSolutions(p.id);
      setSolutions(sols);
    }catch(e){console.error(e)}
  }

  async function submitProblem(e:React.FormEvent){
    e.preventDefault();
    try{
      const id=await createProblem(title,description,difficulty,tags.split(',').map(t=>t.trim()).filter(Boolean));
      setTitle('');setDescription('');setTags('react,typescript');
      const list=await getProblems();
      setProblems(list);
      setView('home');
      alert('Problem created: '+id);
    }catch(err:any){alert(err.message||'Failed')}
  }

  async function submitSolution(e:React.FormEvent){
    e.preventDefault();
    if(!selected)return;
    try{
      await createSolution(selected.id,body);
      setBody('');
      const sols=await getSolutions(selected.id);
      setSolutions(sols);
    }catch(err:any){alert(err.message||'Failed')}
  }

  async function onAccept(sol:Solution){
    if(!selected)return;
    try{
      await acceptSolution(selected.id,sol.id);
      const sols=await getSolutions(selected.id);
      setSolutions(sols);
      const full=await getProblem(selected.id);
      setSelected(full);
    }catch(err:any){alert(err.message||'Failed')}
  }

  async function onBookmark(){
    if(!selected)return;
    try{
      await toggleBookmark(selected.id);
      alert('Bookmark toggled');
    }catch(err:any){alert(err.message||'Failed')}
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand" onClick={()=>setView('home')} style={{cursor:'pointer'}}>
            <span>S</span> SolveHub
          </div>
          <nav className="nav">
            <button className={view==='home'?'active':''} onClick={()=>setView('home')}>Problems</button>
            <button className={view==='new'?'active':''} onClick={()=>setView('new')}>New</button>
            {profile && <button className={view==='profile'?'active':''} onClick={()=>setView('profile')}>{profile.display_name}</button>}
          </nav>
        </div>
      </header>

      <main className="container">
        {loading && <div className="empty">Loading…</div>}

        {!loading && view==='home' && (
          <>
            <section className="hero">
              <h1>Find problems. Share solutions.</h1>
              <p>SolveHub is a community for developers and companies to post real-world problems and collaborate on solutions.</p>
              <button className="btn primary" style={{marginTop:20}} onClick={()=>setView('new')}>Post a problem</button>
            </section>
            <section className="section">
              <div className="section-head">
                <h2>Recent problems</h2>
              </div>
              <div className="search">
                <input placeholder="Search problems…" value={query} onChange={e=>setQuery(e.target.value)} />
              </div>
              <div className="grid">
                {filtered.length===0 && <Empty title="No problems yet" text="Be the first to post a problem." />}
                {filtered.map(p=>(
                  <article key={p.id} className="card" onClick={()=>openProblem(p)} style={{cursor:'pointer'}}>
                    <h3>{p.title}</h3>
                    <p>{p.description.slice(0,140)}{p.description.length>140?'…':''}</p>
                    <div className="meta">
                      <span className="tag">{p.difficulty}</span>
                      <span className="tag muted">{p.status}</span>
                      <span className="muted"><Eye size={14}/> {p.views}</span>
                      <span className="muted">{p.solution_count} solutions</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {!loading && view==='new' && (
          <section className="section">
            <div className="section-head"><h2>Post a new problem</h2></div>
            <form className="form" onSubmit={submitProblem}>
              <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required /></label>
              <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} required /></label>
              <label>Difficulty
                <select value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </label>
              <label>Tags (comma separated)<input value={tags} onChange={e=>setTags(e.target.value)} /></label>
              <div className="form-actions">
                <button type="button" className="btn ghost" onClick={()=>setView('home')}>Cancel</button>
                <button className="btn primary" type="submit">Create</button>
              </div>
            </form>
          </section>
        )}

        {!loading && view==='problem' && selected && (
          <section className="problem-detail">
            <button className="btn ghost" onClick={()=>setView('home')}>← Back</button>
            <h1>{selected.title}</h1>
            <div className="meta">
              <span className="tag">{selected.difficulty}</span>
              <span className="tag">{selected.status}</span>
              <span className="muted"><Eye size={14}/> {selected.views}</span>
              <button className="btn ghost" onClick={onBookmark}><Bookmark size={16}/> Bookmark</button>
            </div>
            <div className="body">{selected.description}</div>
            <h2 style={{marginTop:28}}>Solutions</h2>
            <div className="solutions">
              {solutions.length===0 && <Empty title="No solutions yet" text="Be the first to propose a solution." />}
              {solutions.map(s=>(
                <div key={s.id} className={`solution ${s.is_accepted?'accepted':''}`}>
                  <div className="solution-head">
                    <strong>{s.author?.display_name||'Anonymous'}</strong>
                    {s.is_accepted && <span className="badge">Accepted</span>}
                    {!s.is_accepted && <button className="btn ghost" onClick={()=>onAccept(s)}><CheckCircle2 size={16}/> Accept</button>}
                  </div>
                  <div style={{whiteSpace:'pre-wrap'}}>{s.body}</div>
                </div>
              ))}
            </div>
            <form className="form" style={{marginTop:24}} onSubmit={submitSolution}>
              <label>Your solution<textarea value={body} onChange={e=>setBody(e.target.value)} required /></label>
              <div className="form-actions"><button className="btn primary" type="submit">Submit solution</button></div>
            </form>
          </section>
        )}

        {!loading && view==='profile' && profile && (
          <section className="section">
            <div className="profile-head">
              <div className="avatar">{profile.display_name.slice(0,1).toUpperCase()}</div>
              <div>
                <h2 style={{margin:0}}>{profile.display_name}</h2>
                <p className="muted">@{profile.username} · {profile.role}</p>
              </div>
            </div>
            <div className="metrics">
              <div className="metric"><strong>{profile.reputation}</strong> Reputation</div>
              <div className="metric"><strong>{profile.problems_solved}</strong> Solved</div>
              <div className="metric"><strong>{profile.solutions_accepted}</strong> Accepted</div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="container">SolveHub MVP · Built with Vite, React & Supabase</div>
      </footer>
    </div>
  );
}

function Empty({title,text}:{title:string;text:string}){return <div className="empty"><Code2 size={25}/><h3>{title}</h3><p>{text}</p></div>}

createRoot(document.getElementById('root')!).render(<App/>);
