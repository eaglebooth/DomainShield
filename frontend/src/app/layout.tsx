import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { WalletProvider } from "@/components/WalletProvider";
export const metadata: Metadata={title:"DomainShield | Brand domain risk intelligence",description:"Domain squatting evidence and comparative AI review on GenLayer."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><WalletProvider><Header/>{children}</WalletProvider></body></html>}
