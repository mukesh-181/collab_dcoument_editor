import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar-content";

export function MobileSidebar({ documents }: { documents: any[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-8 w-8 mr-2 -ml-2 text-zinc-500">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SidebarContent documents={documents} />
      </SheetContent>
    </Sheet>
  );
}
