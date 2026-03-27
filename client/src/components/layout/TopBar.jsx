import { HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';

export default function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-dark-900/40 backdrop-blur-md border-b border-dark-700/40 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          className="w-full bg-dark-800/40 border border-dark-600/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500/40 transition-all"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 rounded-xl hover:bg-dark-700/50 transition-all">
          <HiOutlineBell className="w-5 h-5 text-dark-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 bg-primary-500/20 px-3 py-1.5 rounded-lg">
          <span className="text-primary-300 text-sm font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}
