/**
 * ==============================================================================
 * MOMENT 감성 분석 서비스 - Supabase 데이터베이스 연동 모듈
 * 파일명: lib/supabase.js
 * 설명: 사용자가 동의(saveConsent: true)한 경우에만 서버리스 환경에서 안전하게 분석 기록 저장
 * 보안: 서버 전용 SUPABASE_SERVICE_ROLE_KEY 사용 (브라우저 노출 금지)
 * ==============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase 클라이언트 인스턴스 (설정값이 있는 경우에만 초기화)
let supabase = null;

if (supabaseUrl && supabaseServiceRoleKey && !supabaseUrl.includes('your-project-id')) {
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

/**
 * 감성 분석 결과를 Supabase에 저장하는 함수
 * @param {Object} params
 * @param {string} params.inputText - 사용자가 입력한 원문 텍스트 (최대 2,000자)
 * @param {'positive'|'negative'|'neutral'} params.sentiment - 감성 라벨
 * @param {number} params.confidence - 신뢰도 (0~100)
 * @param {string} params.reason - 분석 이유 (최대 500자)
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveSentimentAnalysis({ inputText, sentiment, confidence, reason }) {
    // 1. Supabase 연동 정보가 설정되어 있지 않은 경우 저장을 건너뜁니다.
    if (!supabase) {
        console.warn("Supabase 환경 변수가 설정되지 않아 기록 저장을 건너뜁니다.");
        return false;
    }

    try {
        // 2. sentiment_analyses 테이블에 새 레코드 삽입
        const { error } = await supabase
            .from('sentiment_analyses')
            .insert([
                {
                    input_text: inputText.slice(0, 2000),
                    sentiment: sentiment,
                    confidence: confidence,
                    reason: reason.slice(0, 500)
                }
            ]);

        if (error) {
            console.error("Supabase 데이터 삽입 오류:", error.message);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Supabase 연동 중 예외 발생:", err.message);
        return false;
    }
}

