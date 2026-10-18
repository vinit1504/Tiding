import { useAtom } from "jotai";
import { isSidebarCollapsedAtom } from "@/stores/ui-atom";

/**
 * Custom hook to manage responsive sidebar open/collapse state
 */
export function useSidebar() {
  const [collapsed, setCollapsed] = useAtom(isSidebarCollapsedAtom);

  const toggle = () => setCollapsed((prev) => !prev);
  const expand = () => setCollapsed(false);
  const collapse = () => setCollapsed(true);

  return {
    collapsed,
    setCollapsed,
    toggle,
    expand,
    collapse,
  };
}
