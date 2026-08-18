import { DataProvider } from "./data/DataContext";
import { useData } from "./data/useData";
import { FileUpload } from "./components/FileUpload";
import { MoodOrderConfirm } from "./components/MoodOrderConfirm";
import { Dashboard } from "./pages/Dashboard";

function AppShell() {
  const { rawEntries, moodOrder } = useData();

  if (!rawEntries) return <FileUpload />;
  if (!moodOrder) return <MoodOrderConfirm />;
  return <Dashboard />;
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
