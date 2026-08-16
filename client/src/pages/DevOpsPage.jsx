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
  HiOutlineLink,
  HiOutlineTerminal,
  HiOutlineX,
} from 'react-icons/hi';
import { SiGithub } from 'react-icons/si';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  queued:   { label: 'Queued',   color: 'text-yellow-400',  bg: 'bg-yellow-400/10 text-yellow-400',  icon: HiOutlineClock },
  building: { label: 'Building', color: 'text-blue-400',    bg: 'bg-blue-400/10 text-blue-400',      icon: HiOutlineRefresh },
  running:  { label: 'Live',     color: 'text-emerald-400', bg: 'bg-emerald-400/10 text-emerald-400',icon: HiOutlineCheckCircle },
  failed:   { label: 'Failed',   color: 'text-red-400',     bg: 'bg-red-400/10 text-red-400',        icon: HiOutlineXCircle },
  stopped:  { label: 'Stopped',  color: 'text-slate-400',   bg: 'bg-slate-400/10 text-slate-400',    icon: HiOutlineStop },
  cancelled:{ label: 'Cancelled',color: 'text-slate-400',   bg: 'bg-slate-400/10 text-slate-400',    icon: HiOutlineStop },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.queued;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg}`}>
      <Icon className={`w-3 h-3 ${status === 'building' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
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
    if (level === 'error' || level === 'stderr') return 'text-red-400';
    if (level === 'warn') return 'text-yellow-400';
    return 'text-slate-300';
  };

  return (
    <div className="bg-[#0d1117] rounded-xl border border-slate-700/50 h-80 overflow-y-auto p-4 font-mono text-xs">
      {logs.length === 0 ? (
        <p className="text-slate-600 italic">Waiting for logs...</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className={`leading-relaxed ${logColor(log.level)}`}>
            <span className="text-slate-600 mr-2">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 border border-dark-600/40 rounded-2xl w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-dark-600/40">
          <div className="flex items-center gap-3">
            <SiGithub className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold">Connect Repository</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {!selected ? (
          <div className="p-5 space-y-3">
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 outline-none focus:border-accent-purple/50"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {loading ? (
                <p className="text-slate-400 text-sm text-center py-4">Loading repositories...</p>
              ) : filtered.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No repositories found</p>
              ) : (
                filtered.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => selectRepo(repo)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700 transition-colors text-left"
                  >
                    <HiOutlineCode className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{repo.fullName}</p>
                      {repo.description && (
                        <p className="text-slate-500 text-xs truncate">{repo.description}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                      {repo.private && (
                        <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Private</span>
                      )}
                      {repo.language && (
                        <span className="text-xs text-slate-400">{repo.language}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
              ← Back to repositories
            </button>

            <div className="bg-dark-700/50 rounded-lg p-3 flex items-center gap-3">
              <SiGithub className="w-4 h-4 text-slate-300" />
              <span className="text-white text-sm font-medium">{selected.fullName}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">App Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-purple/50"
                  placeholder="my-app"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Deploy Branch</label>
                <select
                  value={form.defaultBranch}
                  onChange={(e) => setForm((f) => ({ ...f, defaultBranch: e.target.value }))}
                  className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-purple/50"
                >
                  {branches.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Container Port</label>
                <input
                  type="number"
                  value={form.containerPort}
                  onChange={(e) => setForm((f) => ({ ...f, containerPort: Number(e.target.value) }))}
                  className="w-full bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-accent-purple/50"
                />
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={connecting || !form.name}
              className="w-full bg-accent-purple hover:bg-accent-purple/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {connecting ? (
                <><HiOutlineRefresh className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><HiOutlinePlus className="w-4 h-4" /> Connect & Deploy</>
              )}
            </button>
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
      className="bg-dark-800/60 border border-dark-600/30 hover:border-dark-500/50 rounded-2xl overflow-hidden transition-all"
    >
      {/* App Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
              <HiOutlineCode className="w-5 h-5 text-accent-purple" />
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-semibold truncate">{app.name}</h3>
              <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
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
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/5 px-2.5 py-1 rounded-lg border border-emerald-400/20"
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple border border-accent-purple/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700/60 hover:bg-dark-600/60 text-slate-300 border border-dark-500/30 rounded-lg text-xs font-medium transition-all"
          >
            <HiOutlineTerminal className="w-3.5 h-3.5" />
            Deployments
            {expanded ? <HiOutlineChevronDown className="w-3 h-3" /> : <HiOutlineChevronRight className="w-3 h-3" />}
          </button>

          <button
            onClick={() => onDelete(app._id, app.name)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg text-xs transition-all"
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
            className="border-t border-dark-600/30 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {deployments.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No deployments yet</p>
              ) : (
                deployments.map((deploy) => (
                  <div key={deploy._id}>
                    <button
                      onClick={() => setActiveDeployId(activeDeployId === deploy._id ? null : deploy._id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-700/40 hover:bg-dark-600/40 transition-all text-left"
                    >
                      <StatusBadge status={deploy.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-mono truncate">
                          {deploy.commitMessage || deploy.commitSha?.slice(0, 7) || 'Manual trigger'}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">
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
                          className="text-emerald-400 hover:text-emerald-300"
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
          <h1 className="text-3xl font-bold text-white">Deployments</h1>
          <p className="text-slate-400 mt-1">Connect repositories and deploy applications automatically</p>
        </div>
        <div className="flex items-center gap-3">
          {githubStatus.connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
              <SiGithub className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm">{githubStatus.username}</span>
            </div>
          ) : (
            <button
              id="connect-github-btn"
              onClick={() => githubApi.initiateAuth().catch(console.error)}
              className="flex items-center gap-2 px-4 py-2 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-lg text-sm font-medium transition-colors border border-slate-600/50"
            >
              <SiGithub className="w-4 h-4" />
              Connect GitHub
            </button>
          )}
          {githubStatus.connected && (
            <button
              id="add-repo-btn"
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg text-sm font-medium transition-colors"
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
          { label: 'Total Apps', value: apps.length, color: 'text-white' },
          { label: 'Live', value: runningCount, color: 'text-emerald-400' },
          { label: 'Building', value: buildingCount, color: 'text-blue-400' },
          { label: 'GitHub', value: githubStatus.connected ? 'Connected' : 'Disconnected', color: githubStatus.connected ? 'text-emerald-400' : 'text-slate-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 text-center"
          >
            <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Apps List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <HiOutlineRefresh className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HiOutlineCode className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No apps connected</h3>
          <p className="text-slate-400 text-sm mb-6">
            {githubStatus.connected
              ? 'Connect a GitHub repository to start deploying'
              : 'Connect your GitHub account to get started'}
          </p>
          {githubStatus.connected ? (
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Connect Repository
            </button>
          ) : (
            <button
              onClick={() => githubApi.initiateAuth().catch(console.error)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-xl text-sm font-medium transition-colors border border-slate-600/50"
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

      {/* Connect Repo Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <ConnectRepoModal
            onClose={() => setShowConnectModal(false)}
            onConnect={handleConnectRepo}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
