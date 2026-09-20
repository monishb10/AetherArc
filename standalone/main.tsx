import React from 'react';
import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import Lab from '../app/lab/page';
import '../app/globals.css';
import '../app/console.css';
window.__AETHER_STATIC__=true;
const root=createRoot(document.getElementById('root')!);
root.render(new URLSearchParams(window.location.search).has('lab')?<Lab/>:<Home/>);
