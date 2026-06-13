import ArenaTopbar from "./ArenaTopbar";
import ArenaSidebar from "./ArenaSidebar";

export default function ArenaShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFF8E7] flex flex-col">
      <ArenaTopbar />
      <div className="flex flex-1">
        <ArenaSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
