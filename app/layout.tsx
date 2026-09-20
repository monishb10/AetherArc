import type { Metadata } from 'next';
import './globals.css';
import './console.css';
export const metadata:Metadata={title:'AETHER ARC — Collect Legends. Master the Fight.',description:'Enter the convergence. Real-time anime battles, legendary fighters, and a collection worth fighting for.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className="dark"><body>{children}</body></html>}
