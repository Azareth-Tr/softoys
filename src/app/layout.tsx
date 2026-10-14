import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../views/globals.css";
export const metadata: Metadata = { title: "Softoys | Gestión de juguetes", description: "Inventario y gestión de productos de Softoys" };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="es"><body>{children}</body></html>; }