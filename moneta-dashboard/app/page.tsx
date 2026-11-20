"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { OverviewSection } from "@/components/dashboard/sections/overview";
import { Skeleton } from "@/components/ui/skeleton";

function SectionLoader() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-40 rounded-lg" />
        <Skeleton className="h-3.5 w-72 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

const PipelineSection = dynamic(
  () => import("@/components/dashboard/sections/pipeline").then((m) => m.PipelineSection),
  { loading: () => <SectionLoader /> }
);
const DealsSection = dynamic(
  () => import("@/components/dashboard/sections/deals").then((m) => m.DealsSection),
  { loading: () => <SectionLoader /> }
);
const CustomersSection = dynamic(
  () => import("@/components/dashboard/sections/customers").then((m) => m.CustomersSection),
  { loading: () => <SectionLoader /> }
);
const TeamSection = dynamic(
  () => import("@/components/dashboard/sections/team").then((m) => m.TeamSection),
  { loading: () => <SectionLoader /> }
);
const ForecastingSection = dynamic(
  () => import("@/components/dashboard/sections/forecasting").then((m) => m.ForecastingSection),
  { loading: () => <SectionLoader /> }
);
const ReportsSection = dynamic(
  () => import("@/components/dashboard/sections/reports").then((m) => m.ReportsSection),
  { loading: () => <SectionLoader /> }
);
const SettingsSection = dynamic(
  () => import("@/components/dashboard/sections/settings").then((m) => m.SettingsSection),
  { loading: () => <SectionLoader /> }
);

export type Section = "overview" | "pipeline" | "deals" | "customers" | "team" | "forecasting" | "reports" | "settings";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection onNavigate={handleSectionChange} />;
      case "pipeline":
        return <PipelineSection />;
      case "deals":
        return <DealsSection />;
      case "customers":
        return <CustomersSection />;
      case "team":
        return <TeamSection />;
      case "forecasting":
        return <ForecastingSection onNavigate={(s) => handleSectionChange(s as Section)} />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <OverviewSection onNavigate={handleSectionChange} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-clip bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
      />
      <div
        className={`flex-1 min-w-0 flex flex-col ${
          sidebarCollapsed ? "md:ml-[64px]" : "md:ml-[240px]"
        }`}
      >
        <Header
          activeSection={activeSection}
          onNavigate={handleSectionChange}
          onMobileMenuToggle={() => setMobileNavOpen((prev) => !prev)}
        />
        <main className="flex-1 min-w-0 w-full p-4 md:p-6 overflow-x-auto">
          <div
            key={activeSection}
            className="min-w-0 animate-in fade-in duration-150"
          >
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
