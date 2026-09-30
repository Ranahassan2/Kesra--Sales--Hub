export const playNotificationSound = () => {
  if (typeof window === "undefined") return;
  
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(600, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode1.gain.setValueAtTime(0, ctx.currentTime);
    gainNode1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc1.connect(gainNode1);
    gainNode1.connect(ctx.destination);
    
    // Second tone
    const osc2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.2);
    
    gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gainNode2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.12);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.3);
  } catch(e) {
    console.error("Audio play failed", e);
  }
};
