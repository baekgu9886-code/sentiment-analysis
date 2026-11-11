/**
 * ==============================================================================
 * MOMENT 감성 분석 서비스 - 클라이언트 프론트엔드 스크립트
 * 파일명: public/js/app.js
 * 설명: 입력값 실시간 검증, 백엔드 API 통신, 결과 렌더링, 클립보드 결과 복사,
 *       Web Audio API 기반 케로로 효과음 및 [심플 모드 / 해킹 모드] 테마 스위처
 * ==============================================================================
 */

// DOM 준비 완료 시 실행
document.addEventListener("DOMContentLoaded", () => {
    // --------------------------------------------------------------------------
    // 1. 화면 요소 바인딩
    // --------------------------------------------------------------------------
    const form = document.getElementById("sentimentForm");
    const inputText = document.getElementById("inputText");
    const charCount = document.getElementById("charCount");
    const inputError = document.getElementById("inputError");
    const saveConsent = document.getElementById("saveConsent");
    const submitBtn = document.getElementById("submitBtn");
    const btnText = submitBtn.querySelector(".btn-text");

    // 결과 표시 영역 요소
    const resultCard = document.getElementById("resultCard");
    const sentimentBadge = document.getElementById("sentimentBadge");
    const sentimentLabel = document.getElementById("sentimentLabel");
    const confidenceText = document.getElementById("confidenceText");
    const confidenceFill = document.getElementById("confidenceFill");
    const confidenceBarContainer = document.getElementById("confidenceBarContainer");
    const reasonText = document.getElementById("reasonText");
    const saveStatusInfo = document.getElementById("saveStatusInfo");
    const saveStatusText = document.getElementById("saveStatusText");
    const copyResultBtn = document.getElementById("copyResultBtn");
    const copyBtnText = document.getElementById("copyBtnText");

    // 오류 알림 상자 요소
    const alertBox = document.getElementById("alertBox");
    const alertMessage = document.getElementById("alertMessage");
    const retryBtn = document.getElementById("retryBtn");
    const closeAlertBtn = document.getElementById("closeAlertBtn");

    // 춤추는 케로로 캐릭터 요소
    const keroroBtn = document.getElementById("keroroBtn");
    const keroroSpeech = document.getElementById("keroroSpeech");

    // 테마 모드 스위처 요소
    const simpleModeBtn = document.getElementById("simpleModeBtn");
    const hackModeBtn = document.getElementById("hackModeBtn");

    const MAX_LENGTH = 2000;
    let currentAnalysisData = null; // 복사용 데이터 임시 보관

    // 케로로 응원 대사 목록
    const keroroQuotes = [
        "게로게로~ 오늘의 감성은 과연?!",
        "감성 분석 대작전 개시! 끄끄끄~",
        "공명하라! 게로~ 게로~ 게로~",
        "당신의 문장, 퍼렁별 최고의 글이다 게로!",
        "오늘 하루도 힘내라 게로! (ง •̀_•́)ง",
        "쿠루루 상사에게 분석을 맡겨보자 게로!"
    ];
    let quoteIndex = 0;

    // --------------------------------------------------------------------------
    // 2. Web Audio API 기반 효과음 (순수 브라우저 합성)
    // --------------------------------------------------------------------------
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // 뾱! 버블 사운드 (버튼/케로로 클릭 시)
    function playPopSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {
            // 무시
        }
    }

    // 치링~ 차임 사운드 (분석 완료 시)
    function playChimeSound() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + i * 0.06);

                gain.gain.setValueAtTime(0.12, now + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 0.25);
            });
        } catch (e) {
            // 무시
        }
    }

    // --------------------------------------------------------------------------
    // 3. [심플 모드 / 해킹 모드] 테마 스위처 제어
    // --------------------------------------------------------------------------
    function applyThemeMode(mode) {
        document.body.classList.remove("mode-simple", "mode-hacking");

        if (mode === "simple") {
            document.body.classList.add("mode-simple");
            simpleModeBtn.classList.add("active");
            simpleModeBtn.setAttribute("aria-pressed", "true");
            hackModeBtn.classList.remove("active");
            hackModeBtn.setAttribute("aria-pressed", "false");
            if (keroroSpeech) keroroSpeech.textContent = "차분한 심플 모드다 게로! 🌿";
        } else {
            document.body.classList.add("mode-hacking");
            hackModeBtn.classList.add("active");
            hackModeBtn.setAttribute("aria-pressed", "true");
            simpleModeBtn.classList.remove("active");
            simpleModeBtn.setAttribute("aria-pressed", "false");
            if (keroroSpeech) keroroSpeech.textContent = "해킹 모드 가동! 끄끄끄~ ⚡";
        }

        // 사용자의 선택을 브라우저에 저장
        localStorage.setItem("moment_theme_mode", mode);
    }

    // 저장된 모드 복원 (기본값: hacking)
    const savedMode = localStorage.getItem("moment_theme_mode") || "hacking";
    applyThemeMode(savedMode);

    if (simpleModeBtn) {
        simpleModeBtn.addEventListener("click", () => {
            playPopSound();
            applyThemeMode("simple");
        });
    }

    if (hackModeBtn) {
        hackModeBtn.addEventListener("click", () => {
            playPopSound();
            applyThemeMode("hacking");
        });
    }

    // --------------------------------------------------------------------------
    // 4. 실시간 글자 수 카운터
    // --------------------------------------------------------------------------
    inputText.addEventListener("input", () => {
        const currentLength = inputText.value.length;
        charCount.textContent = `${currentLength.toLocaleString()} / ${MAX_LENGTH.toLocaleString()}`;

        if (currentLength >= MAX_LENGTH) {
            charCount.classList.add("limit-max");
            charCount.classList.remove("limit-near");
        } else if (currentLength >= MAX_LENGTH * 0.9) {
            charCount.classList.add("limit-near");
            charCount.classList.remove("limit-max");
        } else {
            charCount.classList.remove("limit-near", "limit-max");
        }

        hideInputError();
        hideAlert();
    });

    // --------------------------------------------------------------------------
    // 5. 입력값 유효성 검사
    // --------------------------------------------------------------------------
    function validateInput(value) {
        const trimmed = value.trim();

        if (trimmed.length === 0) {
            return {
                isValid: false,
                message: "분석할 문장을 한 글자 이상 입력해 주세요."
            };
        }

        if (trimmed.length > MAX_LENGTH) {
            return {
                isValid: false,
                message: `최대 ${MAX_LENGTH.toLocaleString()}자까지만 분석할 수 있습니다.`
            };
        }

        return { isValid: true, trimmedText: trimmed };
    }

    function showInputError(message) {
        inputError.textContent = message;
        inputError.classList.add("show");
        inputText.focus();
    }

    function hideInputError() {
        inputError.textContent = "";
        inputError.classList.remove("show");
    }

    // --------------------------------------------------------------------------
    // 6. 화면 상태 제어
    // --------------------------------------------------------------------------
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.classList.add("loading");
            btnText.textContent = "AI 감성 분석 중...";
            hideAlert();
            if (keroroSpeech) {
                keroroSpeech.textContent = "AI가 열심히 분석하고 있다 게로! 조금만 기다려!";
            }
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            btnText.textContent = "감성 분석하기";
        }
    }

    function showAlert(message) {
        alertMessage.textContent = message;
        alertBox.removeAttribute("hidden");
        alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (keroroSpeech) {
            keroroSpeech.textContent = "어라라? 문제가 생긴 것 같다 게로!";
        }
    }

    function hideAlert() {
        alertBox.setAttribute("hidden", "true");
    }

    if (closeAlertBtn) {
        closeAlertBtn.addEventListener("click", () => {
            hideAlert();
        });
    }

    function displayResult(result, isSaved) {
        currentAnalysisData = result;

        sentimentBadge.classList.remove("sentiment-positive", "sentiment-neutral", "sentiment-negative");

        if (result.sentiment === "positive") {
            sentimentBadge.classList.add("sentiment-positive");
            sentimentLabel.textContent = "긍정 (Positive)";
            if (keroroSpeech) keroroSpeech.textContent = "와아! 긍정적인 좋은 기운이 가득하다 게로! ✨";
        } else if (result.sentiment === "negative") {
            sentimentBadge.classList.add("sentiment-negative");
            sentimentLabel.textContent = "부정 (Negative)";
            if (keroroSpeech) keroroSpeech.textContent = "토닥토닥... 따뜻한 카레 먹고 기운 내라 게로! 🍛";
        } else {
            sentimentBadge.classList.add("sentiment-neutral");
            sentimentLabel.textContent = "중립 (Neutral)";
            if (keroroSpeech) keroroSpeech.textContent = "차분하고 담담한 문장이군 게로! 🌿";
        }

        const confidence = Math.min(Math.max(result.confidence || 0, 0), 100);
        confidenceText.textContent = `${confidence}%`;
        confidenceFill.style.width = `${confidence}%`;
        confidenceBarContainer.setAttribute("aria-valuenow", confidence);

        reasonText.textContent = result.reason || "상세 분석 이유가 제공되지 않았습니다.";

        if (isSaved) {
            saveStatusText.textContent = "동의하신 내용에 따라 분석 기록이 데이터베이스에 안전하게 보관되었습니다.";
            saveStatusInfo.removeAttribute("hidden");
        } else {
            saveStatusInfo.setAttribute("hidden", "true");
        }

        if (copyBtnText) copyBtnText.textContent = "분석 결과 복사하기";
        if (copyResultBtn) copyResultBtn.classList.remove("copied");

        playChimeSound();

        resultCard.removeAttribute("hidden");
        resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // --------------------------------------------------------------------------
    // 7. 결과 복사하기 버튼 이벤트
    // --------------------------------------------------------------------------
    if (copyResultBtn) {
        copyResultBtn.addEventListener("click", async () => {
            if (!currentAnalysisData) return;

            const copyText = `[MOMENT AI 감성 분석 결과]\n` +
                `• 판정: ${currentAnalysisData.label} (${currentAnalysisData.confidence}%)\n` +
                `• 이유: ${currentAnalysisData.reason}\n\n` +
                `👉 나도 분석해보기: ${window.location.href}`;

            try {
                await navigator.clipboard.writeText(copyText);
                copyBtnText.textContent = "✓ 클립보드 복사 완료!";
                copyResultBtn.classList.add("copied");
                playPopSound();
                setTimeout(() => {
                    copyBtnText.textContent = "분석 결과 복사하기";
                    copyResultBtn.classList.remove("copied");
                }, 2500);
            } catch (err) {
                console.error("복사 실패:", err);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 8. 폼 제출 이벤트 처리
    // --------------------------------------------------------------------------
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const validation = validateInput(inputText.value);
        if (!validation.isValid) {
            showInputError(validation.message);
            return;
        }

        setLoading(true);
        hideAlert();
        resultCard.setAttribute("hidden", "true");

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: validation.trimmedText,
                    saveConsent: saveConsent.checked
                })
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                const errorMessage = data.error?.message || "분석 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
                showAlert(errorMessage);
                return;
            }

            displayResult(data.result, data.saved);

        } catch (networkError) {
            console.error("통신 오류:", networkError);
            showAlert("서버와 통신할 수 없습니다. 주소창이 http://localhost:3000 인지 확인해 주세요.");
        } finally {
            setLoading(false);
        }
    });

    retryBtn.addEventListener("click", () => {
        form.requestSubmit();
    });

    // --------------------------------------------------------------------------
    // 9. 케로로 인터랙션 (뾱뾱 사운드 + 대사 전환)
    // --------------------------------------------------------------------------
    if (keroroBtn && keroroSpeech) {
        keroroBtn.addEventListener("click", () => {
            playPopSound();
            quoteIndex = (quoteIndex + 1) % keroroQuotes.length;
            keroroSpeech.textContent = keroroQuotes[quoteIndex];
        });
    }
});
