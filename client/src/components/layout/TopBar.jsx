import { HiOutlineSearch, HiOutlineBell } from 'react-icons/hi';
import { useAuthStore } from '../../store/authStore';

export default function TopBar() {
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-white border-b border-[#E5E7E0] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-full max-w-sm" role="search">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969A92] w-4 h-4" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search tasks, projects..."
          aria-label="Search tasks and projects"
          className="w-full bg-[#F8F9F5] border border-[#E5E7E0] rounded-lg pl-9 pr-4 py-2 text-sm text-[#171820] placeholder-[#969A92] focus:outline-none focus:ring-2 focus:ring-[#C4F13B]/40 focus:border-[#C4F13B] transition-all"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 ml-4">
        <button
          className="relative p-2 rounded-lg hover:bg-[#F1F3ED] transition-all"
          aria-label="Notifications"
        >
          <HiOutlineBell className="w-5 h-5 text-[#6B7068]" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C43D3D] rounded-full" aria-hidden="true" />
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1F3ED] border border-[#E5E7E0]">
          <div className="w-6 h-6 rounded-full bg-[#C4F13B] flex items-center justify-center text-[10px] font-bold text-[#171820]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-[#171820] text-sm font-medium">{user?.name?.split(' ')[0] || 'User'}</span>
        </div>
      </div>
    </header>
  );
}
