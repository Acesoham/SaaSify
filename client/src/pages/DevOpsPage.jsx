import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { appsApi, githubApi, deploymentsApi } from '../services/deploymentApi';
import { getSocket } from '../services/socket';

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  HiOutlineLightningBolt,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineStop,
  HiOutlineRefresh,
  HiOutlinePlus,
  HiOutlineExternalLink,
  HiOutlineCode,
  HiOutlineGlobe,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineTrash,
  HiOutlineTerminal,
  HiOutlineX,
} from 'react-icons/hi';
import { SiGithub } from 'react-icons/si';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  queued:   { label: 'Queued',   textCls: 'text-[#A96612]',  bgCls: 'bg-[#A96612]/10 text-[#A96612]',   icon: HiOutlineClock },
  building: { label: 'Building', textCls: 'text-[#3478B9]',  bgCls: 'bg-[#3478B9]/10 text-[#3478B9]',   icon: HiOutlineRefresh },
  running:  { label: 'Live',     textCls: 'text-[#287D48]',  bgCls: 'bg-[#287D48]/10 text-[#287D48]',   icon: HiOutlineCheckCircle },
  failed:   { label: 'Failed',   textCls: 'text-[#C43D3D]',  bgCls: 'bg-[#C43D3D]/10 text-[#C43D3D]',   icon: HiOutlineXCircle },
  stopped:  { label: 'Stopped',  textCls: 'text-[#969A92]',  bgCls: 'bg-[#F1F3ED] text-[#969A92]',      icon: HiOutlineStop },
  cancelled:{ label: 'Cancelled',textCls: 'text-[#969A92]',  bgCls: 'bg-[#F1F3ED] text-[#969A92]',      icon: HiOutlineStop },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.queued;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgCls}`}>
      <Icon className={`w-3 h-3 ${status === 'building' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

function GithubLoginPrompt({ onClose, onSubmit }) {
  const [login, setLogin] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(23,24,32,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-white border border-[#E5E7E0] rounded-2xl w-full max-w-sm shadow-[0_20px_60px_rgba(23,24,32,0.15)] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#171820] font-semibold text-base flex items-center gap-2">
            <SiGithub className="w-5 h-5 text-[#171820]" />
            Connect GitHub
          </h2>
          <button onClick={onClose} className="text-[#969A92] hover:text-[#171820] transition-colors p-1 rounded-lg hover:bg-[#F1F3ED]">
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[#6B7068] text-sm mb-4">
          Enter the GitHub username you want to connect. We will ask GitHub to authorize this specific account.
        </p>
        <input
          autoFocus
          type="text"
          placeholder="GitHub Username"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && login.trim()) onSubmit(login.trim()); }}
          className="input-field mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">
            Cancel
          </button>
          <button
            disabled={!login.trim()}
            onClick={() => onSubmit(login.trim())}
            className="btn-primary text-sm disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LogViewer({ deploymentId, initialLogs = [] }) {
  const [logs, setLogs] = useState(initialLogs);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!deploymentId) return;
    const socket = getSocket();
    socket.emit('deployment:subscribe', deploymentId);

    socket.on('log:line', (entry) => {
      setLogs((prev) => [...prev.slice(-1999), entry]);
    });

    return () => {
      socket.emit('deployment:unsubscribe', deploymentId);
      socket.off('log:line');
    };
  }, [deploymentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const logColor = (level) => {
    if (level === 'error' || level === 'stderr') return 'text-[#C43D3D]';
    if (level === 'warn') return 'text-[#A96612]';
    return 'text-[#2d4a2e]';
  };

  return (
    <div className="bg-[#0f1117] rounded-xl border border-[#E5E7E0] h-80 overflow-y-auto p-4 font-mono text-xs">
      {logs.length === 0 ? (
        <p className="text-[#4A5568] italic">Waiting for logs...</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className={`leading-relaxed ${logColor(log.level)}`}>
            <span className="text-[#4B5563] mr-2">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            {log.message}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function ConnectRepoModal({ onClose, onConnect }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ defaultBranch: 'main', containerPort: 3000, name: '' });
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    githubApi.listRepos().then((res) => {
      setRepos(res.data.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectRepo = async (repo) => {
    setSelected(repo);
    setForm((f) => ({ ...f, defaultBranch: repo.defaultBranch, name: repo.name }));
    try {
      const [owner, repoName] = repo.fullName.split('/');
      const res = await githubApi.listBranches(owner, repoName);
      setBranches(res.data.data || [repo.defaultBranch]);
    } catch {
      setBranches([repo.defaultBranch]);
    }
  };

  const handleConnect = async () => {
    if (!selected) return;
    setConnecting(true);
    try {
      await onConnect({ repoFullName: selected.fullName, ...form });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to connect repository');
    } finally {
      setConnecting(false);
    }
  };

  const filtered = repos.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(23,24,32,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="bg-white border border-[#E5E7E0] rounded-2xl w-full max-w-lg shadow-[0_20px_60px_rgba(23,24,32,0.15)] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7E0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#171820] rounded-lg flex items-center justify-center">
              <SiGithub className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-[#171820] font-semibold text-base">Connect Repository</h2>
          </div>
          <button onClick={onClose} className="text-[#969A92] hover:text-[#171820] transition-colors p-1 rounded-lg hover:bg-[#F1F3ED]">
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        {!selected ? (
          <div className="p-5 space-y-3">
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[#C4F13B] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {filtered.length === 0 ? (
                    <p className="text-[#969A92] text-sm text-center py-4">No repositories found.</p>
                  ) : (
                    filtered.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => selectRepo(repo)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8F9F5] transition-colors text-left border border-transparent hover:border-[#E5E7E0]"
                      >
                        <HiOutlineCode className="w-4 h-4 text-[#969A92] flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[#171820] text-sm font-medium truncate">{repo.fullName}</p>
                          {repo.description && (
                            <p className="text-[#969A92] text-xs truncate">{repo.description}</p>
                          )}
                        </div>
                        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                          {repo.private && (
                            <span className="text-xs bg-[#F1F3ED] text-[#6B7068] px-1.5 py-0.5 rounded">Private</span>
                          )}
                          {repo.language && (
                            <span className="text-xs text-[#969A92]">{repo.language}</span>
                          )}
                        </div>
                      </button>
                    ))
                  )}

                  {search.includes('/') && !filtered.find(r => r.fullName.toLowerCase() === search.toLowerCase()) && (
                    <button
                      onClick={() => selectRepo({ id: search, fullName: search, name: search.split('/')[1], defaultBranch: 'main' })}
                      className="w-full flex items-center gap-3 p-3 mt-2 rounded-lg border border-dashed border-[#C4F13B]/50 bg-[#EFF9D4]/50 hover:bg-[#EFF9D4] transition-colors text-left"
                    >
                      <SiGithub className="w-4 h-4 text-[#171820] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[#171820] text-sm font-medium truncate">Connect public repo: {search}</p>
                        <p className="text-[#6B7068] text-xs truncate">Deploy this repository manually</p>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <button onClick={() => setSelected(null)} className="text-[#6B7068] hover:text-[#171820] text-sm flex items-center gap-1 transition-colors">
              ← Back to repositories
            </button>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F8F9F5] border border-[#E5E7E0]">
              <SiGithub className="w-4 h-4 text-[#171820]" />
              <span className="text-[#171820] text-sm font-medium">{selected.fullName}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[#6B7068] text-sm mb-1.5 font-medium">App Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  placeholder="my-app"
                />
              </div>
              <div>
                <label className="block text-[#6B7068] text-sm mb-1.5 font-medium">Deploy Branch</label>
                <select
                  value={form.defaultBranch}
                  onChange={(e) => setForm((f) => ({ ...f, defaultBranch: e.target.value }))}
                  className="input-field"
                >
                  {branches.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#6B7068] text-sm mb-1.5 font-medium">Container Port</label>
                <input
                  type="number"
                  value={form.containerPort}
                  onChange={(e) => setForm((f) => ({ ...f, containerPort: Number(e.target.value) }))}
                  className="input-field"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleConnect}
              disabled={connecting || !form.name}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? (
                <><HiOutlineRefresh className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><HiOutlinePlus className="w-4 h-4" /> Connect & Deploy</>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function AppCard({ app, onDeploy, onDelete }) {
  const [deployments, setDeployments] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [activeDeployId, setActiveDeployId] = useState(null);
  const [deploying, setDeploying] = useState(false);

  const loadDeployments = async () => {
    try {
      const res = await deploymentsApi.listForApp(app._id);
      setDeployments(res.data.deployments || []);
    } catch {}
  };

  useEffect(() => {
    if (expanded) loadDeployments();
  }, [expanded]);

  // Subscribe to live status updates for this app's deployments
  useEffect(() => {
    const socket = getSocket();
    socket.on('status:change', ({ status }) => {
      setDeployments((prev) =>
        prev.map((d) => (d._id === activeDeployId ? { ...d, status } : d))
      );
    });
    return () => socket.off('status:change');
  }, [activeDeployId]);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await appsApi.deploy(app._id);
      const newDeploy = res.data.data;
      setDeployments((prev) => [newDeploy, ...prev]);
      setActiveDeployId(newDeploy._id);
      setExpanded(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger deployment');
    } finally {
      setDeploying(false);
    }
  };

  const activeDeployment = app.activeDeploymentId;
  const status = activeDeployment?.status || 'stopped';
  const liveUrl = activeDeployment?.liveUrl;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E5E7E0] hover:border-[#C4F13B]/40 rounded-2xl overflow-hidden transition-all shadow-[0_1px_3px_rgba(23,24,32,0.06)] hover:shadow-[0_4px_12px_rgba(23,24,32,0.08)]"
    >
      {/* App Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EFF9D4] flex items-center justify-center flex-shrink-0">
              <HiOutlineCode className="w-5 h-5 text-[#171820]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[#171820] font-semibold truncate">{app.name}</h3>
              <p className="text-[#969A92] text-xs flex items-center gap-1 mt-0.5">
                <SiGithub className="w-3 h-3" />
                {app.repoFullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Live URL */}
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#287D48] hover:text-[#1f6038] transition-colors bg-[#287D48]/5 px-2.5 py-1 rounded-lg border border-[#287D48]/20"
          >
            <HiOutlineGlobe className="w-3.5 h-3.5" />
            {liveUrl}
            <HiOutlineExternalLink className="w-3 h-3" />
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            id={`deploy-btn-${app._id}`}
            onClick={handleDeploy}
            disabled={deploying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C4F13B] hover:bg-[#B3DF30] text-[#171820] rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
          >
            {deploying ? (
              <HiOutlineRefresh className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <HiOutlineLightningBolt className="w-3.5 h-3.5" />
            )}
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>

          <button
            onClick={() => {
              setExpanded(!expanded);
              if (!expanded) loadDeployments();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F3ED] hover:bg-[#E5E7E0] text-[#6B7068] border border-[#E5E7E0] rounded-lg text-xs font-medium transition-all"
          >
            <HiOutlineTerminal className="w-3.5 h-3.5" />
            Deployments
            {expanded ? <HiOutlineChevronDown className="w-3 h-3" /> : <HiOutlineChevronRight className="w-3 h-3" />}
          </button>

          <button
            onClick={() => onDelete(app._id, app.name)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-[#969A92] hover:text-[#C43D3D] hover:bg-[#C43D3D]/10 rounded-lg text-xs transition-all"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Deployments Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#E5E7E0] overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {deployments.length === 0 ? (
                <p className="text-[#969A92] text-sm text-center py-4">No deployments yet</p>
              ) : (
                deployments.map((deploy) => (
                  <div key={deploy._id}>
                    <button
                      onClick={() => setActiveDeployId(activeDeployId === deploy._id ? null : deploy._id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#F8F9F5] hover:bg-[#F1F3ED] transition-all text-left border border-[#E5E7E0]"
                    >
                      <StatusBadge status={deploy.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#171820] text-xs font-mono truncate">
                          {deploy.commitMessage || deploy.commitSha?.slice(0, 7) || 'Manual trigger'}
                        </p>
                        <p className="text-[#969A92] text-xs mt-0.5">
                          {deploy.branch} · {new Date(deploy.createdAt).toLocaleString()}
                          {deploy.duration && ` · ${(deploy.duration / 1000).toFixed(1)}s`}
                        </p>
                      </div>
                      {deploy.liveUrl && (
                        <a
                          href={deploy.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#287D48] hover:text-[#1f6038] transition-colors"
                        >
                          <HiOutlineExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </button>

                    {/* Live log viewer */}
                    <AnimatePresence>
                      {activeDeployId === deploy._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 overflow-hidden"
                        >
                          <LogViewer deploymentId={deploy._id} initialLogs={deploy.logs || []} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DevOpsPage() {
  const [githubStatus, setGithubStatus] = useState({ connected: false, username: null });
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showGithubPrompt, setShowGithubPrompt] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);

  // Check for OAuth callback result
  useEffect(() => {
    if (urlParams.get('github') === 'connected') {
      window.history.replaceState({}, '', '/devops');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, appsRes] = await Promise.all([
        githubApi.getStatus(),
        appsApi.list(),
      ]);
      setGithubStatus(statusRes.data.data || {});
      setApps(appsRes.data.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnectRepo = async (data) => {
    const res = await appsApi.create(data);
    setApps((prev) => [res.data.data, ...prev]);
  };

  const handleDeleteApp = async (appId, appName) => {
    if (!window.confirm(`Delete "${appName}"? This will stop the deployment and remove the webhook.`)) return;
    try {
      await appsApi.delete(appId);
      setApps((prev) => prev.filter((a) => a._id !== appId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete app');
    }
  };

  // Stats
  const runningCount = apps.filter((a) => a.activeDeploymentId?.status === 'running').length;
  const buildingCount = apps.filter((a) => a.activeDeploymentId?.status === 'building').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#171820]">Deployments</h1>
          <p className="text-[#6B7068] text-sm mt-0.5">Connect repositories and deploy applications automatically</p>
        </div>
        <div className="flex items-center gap-3">
          {githubStatus.connected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#287D48]/10 border border-[#287D48]/20 rounded-lg">
                <SiGithub className="w-4 h-4 text-[#287D48]" />
                <span className="text-[#287D48] text-sm font-medium">{githubStatus.username}</span>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('Disconnect GitHub account?')) return;
                  try {
                    await githubApi.disconnect();
                    setGithubStatus({ connected: false, username: null });
                  } catch {
                    alert('Failed to disconnect GitHub');
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-[#969A92] hover:text-[#C43D3D] hover:bg-[#C43D3D]/10 border border-[#E5E7E0] hover:border-[#C43D3D]/20 rounded-lg transition-colors"
                title="Disconnect GitHub"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              id="connect-github-btn"
              onClick={() => setShowGithubPrompt(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#171820] hover:bg-[#2a2d38] text-white rounded-lg text-sm font-medium transition-colors"
            >
              <SiGithub className="w-4 h-4" />
              Connect GitHub
            </button>
          )}
          {githubStatus.connected && (
            <button
              id="add-repo-btn"
              onClick={() => setShowConnectModal(true)}
              className="btn-primary"
            >
              <HiOutlinePlus className="w-4 h-4" />
              New App
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Apps', value: apps.length,       color: 'text-[#171820]' },
          { label: 'Live',       value: runningCount,      color: 'text-[#287D48]'  },
          { label: 'Building',   value: buildingCount,     color: 'text-[#3478B9]'  },
          { label: 'GitHub',     value: githubStatus.connected ? 'Connected' : 'Disconnected', color: githubStatus.connected ? 'text-[#287D48]' : 'text-[#969A92]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-[#E5E7E0] rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(23,24,32,0.06)]"
          >
            <p className="text-[#969A92] text-xs mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Apps List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-[#C4F13B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-[#E5E7E0] rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(23,24,32,0.06)]"
        >
          <div className="w-16 h-16 bg-[#EFF9D4] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HiOutlineCode className="w-8 h-8 text-[#171820]" />
          </div>
          <h3 className="text-[#171820] font-semibold text-lg mb-2">No apps connected</h3>
          <p className="text-[#969A92] text-sm mb-6">
            {githubStatus.connected
              ? 'Connect a GitHub repository to start deploying'
              : 'Connect your GitHub account to get started'}
          </p>
          {githubStatus.connected ? (
            <button
              onClick={() => setShowConnectModal(true)}
              className="btn-primary mx-auto"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Connect Repository
            </button>
          ) : (
            <button
              onClick={() => setShowGithubPrompt(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#171820] hover:bg-[#2a2d38] text-white rounded-xl text-sm font-medium transition-colors"
            >
              <SiGithub className="w-4 h-4" />
              Connect GitHub
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => (
            <AppCard key={app._id} app={app} onDelete={handleDeleteApp} />
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showConnectModal && (
          <ConnectRepoModal
            onClose={() => setShowConnectModal(false)}
            onConnect={handleConnectRepo}
          />
        )}
        {showGithubPrompt && (
          <GithubLoginPrompt
            onClose={() => setShowGithubPrompt(false)}
            onSubmit={(login) => {
              setShowGithubPrompt(false);
              githubApi.initiateAuth(login).catch(console.error);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
