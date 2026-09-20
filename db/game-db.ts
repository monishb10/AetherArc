import {env} from 'cloudflare:workers';
export function gameDb(){if(!env.DB)throw new Error('Saved progress is temporarily unavailable. Please try again.');return env.DB;}
