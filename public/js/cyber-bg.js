/**
 * ==============================================================================
 * MOMENT 감성 분석 서비스 - 고강도 3D 사이버 해킹 라이브 엔진 (High-Impact Cyber Engine)
 * 파일명: public/js/cyber-bg.js
 * 설명: 압도적인 네온 발광, 3D 와이어프레임 워프, 마우스 반응형 입체 틸트 및 
 *       번쩍이는 디지털 레인과 스캔라인 효과로 강렬한 SF 해킹 비주얼을 연출합니다.
 * ==============================================================================
 */

(function initHighImpactCyberBackground() {
    const canvas = document.getElementById("cyberCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;

    // 마우스 반응형 3D 카메라 틸트 변수
    let mouseX = 0;
    let mouseY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5; // -0.5 ~ +0.5
        mouseY = (e.clientY / window.innerHeight) - 0.5;
        targetTiltX = mouseX * 80;
        targetTiltY = mouseY * 40;
    });

    // 1. 화면 해상도 동기화
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // 2. 해킹 매트릭스 스트림 글자 집합 및 다채로운 네온 컬러 팔레트
    const CHARACTERS = "0101010101ABCDEF0123456789<>/*+-~$#%&!?:KULULU_SYSTEM_OVERRIDE_ROOT_KERNEL_ACCESS_GRANTED_";
    const FONT_SIZE = 16;
    let columns = Math.floor(width / FONT_SIZE);
    let drops = [];

    // 네온 컬러 프리셋 (초록 매트릭스 + 사이버 핑크 + 일렉트릭 시안)
    const NEON_COLORS = [
        { primary: "#00ff66", glow: "#00cc55", head: "#ffffff" }, // 네온 매트릭스 그린
        { primary: "#ff007f", glow: "#ff4f9a", head: "#ffffff" }, // 네온 일렉트릭 핑크
        { primary: "#00f0ff", glow: "#00b4d8", head: "#ffffff" }  // 네온 사이버 시안
    ];

    function initDrops() {
        columns = Math.floor(width / FONT_SIZE);
        drops = [];
        for (let i = 0; i < columns; i++) {
            drops.push({
                y: Math.random() * -120,
                speed: 1.5 + Math.random() * 3.5, // 역동적인 낙하 속도
                length: 8 + Math.floor(Math.random() * 16),
                colorScheme: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
                depth: 0.6 + Math.random() * 0.7, // 3D 깊이
                glitchTimer: Math.random() * 100
            });
        }
    }
    initDrops();
    window.addEventListener("resize", initDrops);

    // 3. 3D 네온 와이어프레임 그리드 변수
    let gridOffset = 0;
    let scanlineY = 0;

    // 4. 고속 메인 렌더링 루프
    function draw() {
        // 부드러운 카메라 틸트 보간 (Lerp)
        currentTiltX += (targetTiltX - currentTiltX) * 0.05;
        currentTiltY += (targetTiltY - currentTiltY) * 0.05;

        // 잔상 효과 (배경 투명도 제어)
        ctx.fillStyle = "rgba(10, 2, 7, 0.28)";
        ctx.fillRect(0, 0, width, height);

        // ----------------------------------------------------------------------
        // [1] 3D 사이버네틱 와이어프레임 네온 그리드 (Floor & Horizon)
        // ----------------------------------------------------------------------
        const horizonY = height * 0.52 + currentTiltY;
        const fov = 380;
        const centerX = width / 2 + currentTiltX;

        ctx.save();
        ctx.lineWidth = 1.6;

        // 지평선 광원 펄스 (글로우)
        const horizonGlow = ctx.createRadialGradient(centerX, horizonY, 10, centerX, horizonY, width * 0.65);
        horizonGlow.addColorStop(0, "rgba(255, 0, 127, 0.45)");
        horizonGlow.addColorStop(0.3, "rgba(0, 240, 255, 0.2)");
        horizonGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, horizonY - 100, width, height - horizonY + 100);

        // 세로 원근 방사선 (Perspective Radial Lines)
        const vLines = 28;
        for (let i = -vLines; i <= vLines; i++) {
            const xOffset = i * (width / vLines);
            ctx.strokeStyle = i % 2 === 0 ? "rgba(0, 240, 255, 0.35)" : "rgba(255, 0, 127, 0.35)";
            ctx.shadowColor = i % 2 === 0 ? "#00f0ff" : "#ff007f";
            ctx.shadowBlur = 8;

            ctx.beginPath();
            ctx.moveTo(centerX, horizonY);
            ctx.lineTo(centerX + xOffset * 3.8, height);
            ctx.stroke();
        }

        // 앞으로 빠르게 질주하는 가로 그리드선 (Speed Lines)
        gridOffset = (gridOffset + 1.2) % 36;
        for (let z = 10; z < fov; z += 24) {
            const currentZ = (z + gridOffset);
            const py = horizonY + (fov * (height - horizonY)) / (currentZ + 90);
            if (py <= height && py >= horizonY) {
                const alpha = Math.min(1, Math.pow((py - horizonY) / (height - horizonY), 1.4));
                ctx.strokeStyle = `rgba(0, 255, 102, ${alpha * 0.85})`;
                ctx.shadowColor = "#00ff66";
                ctx.shadowBlur = 12;

                ctx.beginPath();
                ctx.moveTo(0, py);
                ctx.lineTo(width, py);
                ctx.stroke();
            }
        }
        ctx.restore();

        // ----------------------------------------------------------------------
        // [2] 강렬한 네온 디지털 해킹 매트릭스 스트림 (High-Luminance Rain)
        // ----------------------------------------------------------------------
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            const x = i * FONT_SIZE;
            const y = drop.y * FONT_SIZE;

            const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
            const color = drop.colorScheme;

            // 맨 앞의 선두 글자 (강렬한 화이트-네온 헤드)
            ctx.font = `bold ${Math.floor(FONT_SIZE * drop.depth)}px monospace`;
            ctx.fillStyle = color.head;
            ctx.shadowBlur = 16;
            ctx.shadowColor = color.primary;
            ctx.fillText(char, x, y);

            // 뒤따라오는 선명한 네온 바디 문자들
            for (let j = 1; j < 6; j++) {
                const prevY = y - j * FONT_SIZE;
                if (prevY > 0) {
                    const trailAlpha = Math.max(0.2, (1 - j / 6) * drop.depth);
                    ctx.fillStyle = color.primary;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = color.glow;
                    const trailChar = CHARACTERS[(i + j + Math.floor(drop.glitchTimer)) % CHARACTERS.length];
                    ctx.fillText(trailChar, x, prevY);
                }
            }

            // 낙하 이동
            drop.y += drop.speed * 0.42;
            drop.glitchTimer += 0.1;

            // 화면 하단 도달 시 리셋
            if (y > height + 80 && Math.random() > 0.96) {
                drop.y = -10;
                drop.speed = 1.5 + Math.random() * 3.5;
                drop.colorScheme = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
            }
        }

        // ----------------------------------------------------------------------
        // [3] 해커 CRT 스캔라인 및 글리치 플래시 (Scanline & Glitch Pulse)
        // ----------------------------------------------------------------------
        scanlineY = (scanlineY + 4) % height;
        ctx.fillStyle = "rgba(0, 240, 255, 0.06)";
        ctx.fillRect(0, scanlineY, width, 3);

        // 간헐적인 사이버 글리치 플래시 효과 (0.5% 확률)
        if (Math.random() < 0.005) {
            ctx.fillStyle = "rgba(255, 0, 127, 0.08)";
            ctx.fillRect(0, Math.random() * height, width, 8);
        }

        // ----------------------------------------------------------------------
        // [4] 가독성을 보호하면서도 네온이 뚫고 나오는 스마트 비네팅
        // ----------------------------------------------------------------------
        const vignette = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.1,
            width / 2, height / 2, width * 0.75
        );
        vignette.addColorStop(0, "rgba(18, 4, 12, 0.48)");
        vignette.addColorStop(0.6, "rgba(14, 2, 9, 0.35)");
        vignette.addColorStop(1, "rgba(5, 0, 3, 0.82)");

        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
})();
