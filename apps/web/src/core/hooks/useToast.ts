import { useState } from 'react'; export function useToast(){ const [msg,set]=useState(''); return {msg,show:set}; }
