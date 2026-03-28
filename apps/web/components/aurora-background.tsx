export function AuroraBackground() {
  return <>
    <style dangerouslySetInnerHTML={{
      __html: `
      .aurora-blob-1 {
        position: absolute;
        top: -10%; left: -10%;
        width: 50vw; height: 50vw;
        background: radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 65%);
        filter: blur(80px);
        animation: float-slow 20s infinite ease-in-out alternate;
        z-index: -1;
        border-radius: 50%;
      }
      .aurora-blob-2 {
        position: absolute;
        bottom: -20%; right: -10%;
        width: 60vw; height: 60vw;
        background: radial-gradient(circle, rgba(93,14,17,0.2) 0%, transparent 65%);
        filter: blur(80px);
        animation: float-slow 25s infinite ease-in-out alternate-reverse;
        z-index: -1;
        border-radius: 50%;
      }
      @keyframes float-slow {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(8%, 12%) scale(1.15); }
      }
    `}} />
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      <div className="aurora-blob-1"></div>
      <div className="aurora-blob-2"></div>
    </div>
  </>
}