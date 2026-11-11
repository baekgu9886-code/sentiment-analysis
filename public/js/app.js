/**
 * ==============================================================================
 * MOMENT 감성 분석 서비스 - 클라이언트 프론트엔드 스크립트
 * 파일명: public/js/app.js
 * 설명: 입력값 실시간 검증, 백엔드 API 통신, 결과 렌더링, 클립보드 결과 복사,
 *       Web Audio API 효과음, [심플/해킹] 테마 스위처 및 [한/영] 다국어(i18n) 시스템
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

    // 다국어 언어 스위처 요소
    const langKoBtn = document.getElementById("langKoBtn");
    const langEnBtn = document.getElementById("langEnBtn");
    const heroTitle = document.getElementById("heroTitle");

    const MAX_LENGTH = 2000;
    let currentAnalysisData = null; // 복사용 데이터 임시 보관
    let currentLang = "ko"; // 현재 언어 상태 (기본값: ko)

    // --------------------------------------------------------------------------
    // 2. 다국어 사전 (i18n Translations Dictionary)
    // --------------------------------------------------------------------------
    const I18N = {
        ko: {
            "theme.simple": "🌿 심플 모드",
            "theme.hacking": "⚡ 해킹 모드",
            "nav.about": "서비스 소개",
            "nav.analyze": "분석하기",
            "hero.badge": "WORDS HAVE FEELINGS",
            "hero.title": `문장 속에 담긴<br><span class="highlight-text">감정을 읽다</span>`,
            "hero.desc": "짧은 문장부터 긴 이야기까지, AI가 글의 감성 흐름을 차분하고 직관적으로 분석해 드립니다. 당신의 문장은 오늘 어떤 온도를 품고 있나요?",
            "hero.cta": "감성 분석 시작하기",
            "card.posTitle": "긍정 (Positive)",
            "card.posDesc": "기쁨, 설렘, 감사와 만족의 순간",
            "card.neuTitle": "중립 (Neutral)",
            "card.neuDesc": "담담하고 객관적인 사실과 균형",
            "card.negTitle": "부정 (Negative)",
            "card.negDesc": "슬픔, 아쉬움, 위로가 필요한 이야기",
            "card.reaTitle": "감정의 이유",
            "card.reaDesc": "문맥과 어휘에 기반한 명확한 분석 근거",
            "form.title": "오늘의 문장을 분석해 보세요",
            "form.subtitle": "분석하고 싶은 텍스트를 입력창에 자유롭게 남겨주세요. (최대 2,000자)",
            "form.inputLabel": "분석할 텍스트",
            "form.placeholder": "예: 오늘 아침 커피 향이 참 좋아서 기분 좋게 하루를 시작했어요. 하지만 오후에는 할 일이 너무 많아서 조금 지쳤네요.",
            "form.consentText": "[선택] 분석 결과 개선 및 통계를 위해 입력한 문장과 분석 결과 저장을 허용합니다.",
            "form.consentInfo": "* 동의하지 않아도 감성 분석은 제한 없이 자유롭게 이용하실 수 있습니다.",
            "form.submitBtn": "감성 분석하기",
            "form.submitting": "AI 감성 분석 중...",
            "alert.title": "오류가 발생했습니다",
            "alert.retry": "다시 시도",
            "result.tag": "분석 결과",
            "result.confTitle": "판정 신뢰도",
            "result.confCaption": "* 표시된 신뢰도는 AI 모델의 자체 추정치이며, 통계적 보정치가 아니므로 문맥에 따라 차이가 있을 수 있습니다.",
            "result.reasonTitle": "분석 이유",
            "result.copyBtn": "분석 결과 복사하기",
            "result.copiedBtn": "✓ 클립보드 복사 완료!",
            "result.savedText": "분석 기록이 안전하게 저장되었습니다.",
            "footer.notice": "본 서비스의 AI 감성 분석 결과는 문맥 이해를 돕기 위한 참고 정보이며, 심리 진단이나 전문적 의학 소견을 대체할 수 없습니다.",
            "val.empty": "분석할 문장을 한 글자 이상 입력해 주세요.",
            "val.max": "최대 2,000자까지만 분석할 수 있습니다.",
            "net.error": "서버와 통신할 수 없습니다. 주소창이 http://localhost:3000 인지 확인해 주세요.",
            "label.positive": "긍정 (Positive)",
            "label.neutral": "중립 (Neutral)",
            "label.negative": "부정 (Negative)",
            "quotes": [
                "게로게로~ 오늘의 감성을 알려줘!",
                "감성 분석 대작전 개시! 끄끄끄~",
                "공명하라! 게로~ 게로~ 게로~",
                "당신의 문장, 퍼렁별 최고의 글이다 게로!",
                "오늘 하루도 힘내라 게로! (ง •̀_•́)ง",
                "쿠루루 상사에게 분석을 맡겨보자 게로!"
            ]
        },
        en: {
            "theme.simple": "🌿 Simple Mode",
            "theme.hacking": "⚡ Hacker Mode",
            "nav.about": "About",
            "nav.analyze": "Analyze",
            "hero.badge": "WORDS HAVE FEELINGS",
            "hero.title": `Reading Emotions<br><span class="highlight-text">Inside Sentences</span>`,
            "hero.desc": "From quick notes to deep stories, AI intuitively reads the emotional currents of your words. What temperature does your sentence hold today?",
            "hero.cta": "Start Sentiment Analysis",
            "card.posTitle": "Positive",
            "card.posDesc": "Joy, excitement, gratitude, and satisfaction",
            "card.neuTitle": "Neutral",
            "card.neuDesc": "Calm facts, balance, and objective reality",
            "card.negTitle": "Negative",
            "card.negDesc": "Sorrow, fatigue, regret, and need for comfort",
            "card.reaTitle": "Reasoning",
            "card.reaDesc": "Clear sentiment evidence backed by context & vocabulary",
            "form.title": "Analyze Today's Sentence",
            "form.subtitle": "Type or paste any sentence you wish to evaluate. (Max 2,000 chars)",
            "form.inputLabel": "Text to Analyze",
            "form.placeholder": "e.g., The coffee aroma was fantastic this morning, starting my day great. However, having too much work in the afternoon made me slightly worn out.",
            "form.consentText": "[Optional] Allow saving input text and sentiment results for model improvements.",
            "form.consentInfo": "* You can freely use sentiment analysis without giving consent.",
            "form.submitBtn": "Analyze Sentiment",
            "form.submitting": "Analyzing Sentiment with AI...",
            "alert.title": "An error occurred",
            "alert.retry": "Retry",
            "result.tag": "Analysis Result",
            "result.confTitle": "Confidence Score",
            "result.confCaption": "* The displayed confidence score is the AI model's estimation and does not represent calibrated statistical probability.",
            "result.reasonTitle": "Analysis Reason",
            "result.copyBtn": "Copy Analysis Result",
            "result.copiedBtn": "✓ Copied to Clipboard!",
            "result.savedText": "Analysis record safely stored in database.",
            "footer.notice": "AI sentiment analysis results are reference information for understanding emotional nuances and cannot substitute medical or psychological diagnosis.",
            "val.empty": "Please enter at least one character to analyze.",
            "val.max": "Maximum text limit is 2,000 characters.",
            "net.error": "Unable to communicate with server. Please verify you are on http://localhost:3000.",
            "label.positive": "Positive",
            "label.neutral": "Neutral",
            "label.negative": "Negative",
            "quotes": [
                "Gero-gero~ Tell me your feelings today!",
                "Sentiment analysis mission start! Ke-ke-ke~",
                "Resonate! Gero~ Gero~ Gero~",
                "Your sentence is the finest in Pekopon!",
                "Cheer up today as well, gero! (ง •̀_•́)ง",
                "Leave the analysis to Sgt. Major Kululu!"
            ]
        }
    };

    let quoteIndex = 0;

    // --------------------------------------------------------------------------
    // 3. 다국어(i18n) 적용 함수
    // --------------------------------------------------------------------------
    function applyLanguage(lang) {
        currentLang = lang === "en" ? "en" : "ko";
        const dict = I18N[currentLang];

        // 1) data-i18n 속성을 가진 모든 엘리먼트 텍스트 교체
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // 2) HTML 태그가 포함된 타이틀 및 플레이스홀더 교체
        if (heroTitle) {
            heroTitle.innerHTML = dict["hero.title"];
        }
        if (inputText) {
            inputText.placeholder = dict["form.placeholder"];
        }

        // 3) 버튼 활성화 상태 갱신
        if (currentLang === "en") {
            langEnBtn.classList.add("active");
            langEnBtn.setAttribute("aria-pressed", "true");
            langKoBtn.classList.remove("active");
            langKoBtn.setAttribute("aria-pressed", "false");
        } else {
            langKoBtn.classList.add("active");
            langKoBtn.setAttribute("aria-pressed", "true");
            langEnBtn.classList.remove("active");
            langEnBtn.setAttribute("aria-pressed", "false");
        }

        // 4) 케로로 대사 즉시 갱신
        if (keroroSpeech) {
            keroroSpeech.textContent = dict.quotes[quoteIndex % dict.quotes.length];
        }

        // 5) 결과 카드 라벨 재반영 (현재 결과가 열려있는 경우)
        if (currentAnalysisData) {
            if (currentAnalysisData.sentiment === "positive") {
                sentimentLabel.textContent = dict["label.positive"];
            } else if (currentAnalysisData.sentiment === "negative") {
                sentimentLabel.textContent = dict["label.negative"];
            } else {
                sentimentLabel.textContent = dict["label.neutral"];
            }
        }

        // 6) 선택값 브라우저 저장
        localStorage.setItem("moment_language", currentLang);
    }

    // --------------------------------------------------------------------------
    // 4. Web Audio API 효과음
    // --------------------------------------------------------------------------
    let audioCtx = null;
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtx = new AudioContextClass();
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

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
        } catch (e) {}
    }

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
        } catch (e) {}
    }

    // --------------------------------------------------------------------------
    // 5. [심플/해킹] 테마 모드 제어
    // --------------------------------------------------------------------------
    function applyThemeMode(mode) {
        document.body.classList.remove("mode-simple", "mode-hacking");

        if (mode === "simple") {
            document.body.classList.add("mode-simple");
            simpleModeBtn.classList.add("active");
            simpleModeBtn.setAttribute("aria-pressed", "true");
            hackModeBtn.classList.remove("active");
            hackModeBtn.setAttribute("aria-pressed", "false");
            if (keroroSpeech) {
                keroroSpeech.textContent = currentLang === "en" ? "Serene Simple Mode! 🌿" : "차분한 심플 모드다 게로! 🌿";
            }
        } else {
            document.body.classList.add("mode-hacking");
            hackModeBtn.classList.add("active");
            hackModeBtn.setAttribute("aria-pressed", "true");
            simpleModeBtn.classList.remove("active");
            simpleModeBtn.setAttribute("aria-pressed", "false");
            if (keroroSpeech) {
                keroroSpeech.textContent = currentLang === "en" ? "Hacking Mode Online! Ke-ke-ke~ ⚡" : "해킹 모드 가동! 끄끄끄~ ⚡";
            }
        }
        localStorage.setItem("moment_theme_mode", mode);
    }

    // 초기 테마 복원
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
    // 6. 언어 스위처 이벤트 바인딩
    // --------------------------------------------------------------------------
    if (langKoBtn) {
        langKoBtn.addEventListener("click", () => {
            playPopSound();
            applyLanguage("ko");
        });
    }

    if (langEnBtn) {
        langEnBtn.addEventListener("click", () => {
            playPopSound();
            applyLanguage("en");
        });
    }

    // 초기 언어 복원
    const savedLang = localStorage.getItem("moment_language") || "ko";
    applyLanguage(savedLang);

    // --------------------------------------------------------------------------
    // 7. 실시간 글자 수 카운터
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
    // 8. 입력값 유효성 검사
    // --------------------------------------------------------------------------
    function validateInput(value) {
        const trimmed = value.trim();
        const dict = I18N[currentLang];

        if (trimmed.length === 0) {
            return { isValid: false, message: dict["val.empty"] };
        }
        if (trimmed.length > MAX_LENGTH) {
            return { isValid: false, message: dict["val.max"] };
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
    // 9. 화면 상태 제어
    // --------------------------------------------------------------------------
    function setLoading(isLoading) {
        const dict = I18N[currentLang];
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.classList.add("loading");
            btnText.textContent = dict["form.submitting"];
            hideAlert();
            if (keroroSpeech) {
                keroroSpeech.textContent = currentLang === "en" 
                    ? "AI is working hard analyzing! Just a moment, gero!" 
                    : "AI가 열심히 분석하고 있다 게로! 조금만 기다려!";
            }
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove("loading");
            btnText.textContent = dict["form.submitBtn"];
        }
    }

    function showAlert(message) {
        alertMessage.textContent = message;
        alertBox.removeAttribute("hidden");
        alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (keroroSpeech) {
            keroroSpeech.textContent = currentLang === "en" 
                ? "Uh-oh? Seems like a glitch occurred, gero!" 
                : "어라라? 문제가 생긴 것 같다 게로!";
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
        const dict = I18N[currentLang];

        sentimentBadge.classList.remove("sentiment-positive", "sentiment-neutral", "sentiment-negative");

        if (result.sentiment === "positive") {
            sentimentBadge.classList.add("sentiment-positive");
            sentimentLabel.textContent = dict["label.positive"];
            if (keroroSpeech) {
                keroroSpeech.textContent = currentLang === "en"
                    ? "Wow! Filled with bright positive energy, gero! ✨"
                    : "와아! 긍정적인 좋은 기운이 가득하다 게로! ✨";
            }
        } else if (result.sentiment === "negative") {
            sentimentBadge.classList.add("sentiment-negative");
            sentimentLabel.textContent = dict["label.negative"];
            if (keroroSpeech) {
                keroroSpeech.textContent = currentLang === "en"
                    ? "Pat pat... Eat some warm curry and cheer up, gero! 🍛"
                    : "토닥토닥... 따뜻한 카레 먹고 기운 내라 게로! 🍛";
            }
        } else {
            sentimentBadge.classList.add("sentiment-neutral");
            sentimentLabel.textContent = dict["label.neutral"];
            if (keroroSpeech) {
                keroroSpeech.textContent = currentLang === "en"
                    ? "A calm and well-balanced sentence, gero! 🌿"
                    : "차분하고 담담한 문장이군 게로! 🌿";
            }
        }

        const confidence = Math.min(Math.max(result.confidence || 0, 0), 100);
        confidenceText.textContent = `${confidence}%`;
        confidenceFill.style.width = `${confidence}%`;
        confidenceBarContainer.setAttribute("aria-valuenow", confidence);

        reasonText.textContent = result.reason || (currentLang === "en" ? "Analysis reasoning completed." : "상세 분석 이유가 제공되지 않았습니다.");

        if (isSaved) {
            saveStatusText.textContent = dict["result.savedText"];
            saveStatusInfo.removeAttribute("hidden");
        } else {
            saveStatusInfo.setAttribute("hidden", "true");
        }

        if (copyBtnText) copyBtnText.textContent = dict["result.copyBtn"];
        if (copyResultBtn) copyResultBtn.classList.remove("copied");

        playChimeSound();

        resultCard.removeAttribute("hidden");
        resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // --------------------------------------------------------------------------
    // 10. 결과 복사하기 버튼
    // --------------------------------------------------------------------------
    if (copyResultBtn) {
        copyResultBtn.addEventListener("click", async () => {
            if (!currentAnalysisData) return;
            const dict = I18N[currentLang];

            const copyText = `[MOMENT AI Sentiment Analysis Result]\n` +
                `• Sentiment: ${currentAnalysisData.label} (${currentAnalysisData.confidence}%)\n` +
                `• Reason: ${currentAnalysisData.reason}\n\n` +
                `👉 Analyze yours: ${window.location.href}`;

            try {
                await navigator.clipboard.writeText(copyText);
                copyBtnText.textContent = dict["result.copiedBtn"];
                copyResultBtn.classList.add("copied");
                playPopSound();
                setTimeout(() => {
                    copyBtnText.textContent = dict["result.copyBtn"];
                    copyResultBtn.classList.remove("copied");
                }, 2500);
            } catch (err) {
                console.error("복사 실패:", err);
            }
        });
    }

    // --------------------------------------------------------------------------
    // 11. 폼 제출 이벤트
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
            showAlert(I18N[currentLang]["net.error"]);
        } finally {
            setLoading(false);
        }
    });

    retryBtn.addEventListener("click", () => {
        form.requestSubmit();
    });

    // --------------------------------------------------------------------------
    // 12. 케로로 인터랙션 (뾱뾱 사운드 + 대사 전환)
    // --------------------------------------------------------------------------
    if (keroroBtn && keroroSpeech) {
        keroroBtn.addEventListener("click", () => {
            playPopSound();
            const quotes = I18N[currentLang].quotes;
            quoteIndex = (quoteIndex + 1) % quotes.length;
            keroroSpeech.textContent = quotes[quoteIndex];
        });
    }
});
